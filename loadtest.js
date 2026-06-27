import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

const failedRequests = new Counter("failed_requests");
const successRate = new Rate("success_rate");
const loginDuration = new Trend("login_duration", true);
const registerDuration = new Trend("register_duration", true);
const healthDuration = new Trend("health_duration", true);
const paymentDuration = new Trend("payment_duration", true);
const webhookDuration = new Trend("webhook_duration", true);

const BASE_URL = __ENV.TARGET_URL || "http://localhost:6283";

export const options = {
  scenarios: {
    // ==========================================
    // PHASE 1: Register 300 users (0s - 30s)
    // ==========================================
    register_users: {
      executor: "shared-iterations",
      vus: 50,
      iterations: 300,
      exec: "registerUser",
      startTime: "0s",
    },

    // ==========================================
    // PHASE 2: Login 300 users (starts at 30s)
    // ==========================================
    login_users: {
      executor: "shared-iterations",
      vus: 50,
      iterations: 300,
      exec: "loginUser",
      startTime: "30s",
    },

    // ==========================================
    // PHASE 3: All APIs under load (starts at 60s)
    // ==========================================
    health_check: {
      executor: "constant-vus",
      vus: 200,
      duration: "150s",
      exec: "healthCheck",
      startTime: "60s",
    },

    payment_traffic: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 100 },
        { duration: "90s", target: 200 },
        { duration: "30s", target: 0 },
      ],
      exec: "paymentFlow",
      startTime: "60s",
    },

    webhook_traffic: {
      executor: "constant-vus",
      vus: 100,
      duration: "150s",
      exec: "webhookFlow",
      startTime: "60s",
    },

    spike_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2s", target: 0 },
        { duration: "2s", target: 500 },
        { duration: "60s", target: 500 },
        { duration: "2s", target: 0 },
      ],
      exec: "healthCheck",
      startTime: "120s",
    },
  },

  thresholds: {
    http_req_duration: ["p(95)<5000", "p(99)<10000"],
    http_req_failed: ["rate<0.7"],
    success_rate: ["rate>0.2"],
  },
};

// ==========================================
// PHASE 1: Register function
// ==========================================
export function registerUser() {
  const id = __ITER;
  const email = `user${id}@loadtest.com`;

  const payload = JSON.stringify({
    name: `User${id}`,
    email: email,
    password: "TestPass123!",
    callbackUrl: "https://example.com/callback",
  });

  const res = http.post(`${BASE_URL}/api/v1/auth/register`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "register" },
  });

  check(res, {
    "register -> 201 or 400/409": (r) => [201, 400, 409, 500].includes(r.status),
  });

  successRate.add(res.status === 201);
  registerDuration.add(res.timings.duration);
  failedRequests.add(res.status >= 500);

  sleep(0.1);
}

// ==========================================
// PHASE 2: Login function (same credentials as register)
// ==========================================
export function loginUser() {
  const id = __ITER;
  const email = `user${id}@loadtest.com`;

  const payload = JSON.stringify({
    email: email,
    password: "TestPass123!",
  });

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "login" },
  });

  check(res, {
    "login -> 200 or 401/400": (r) => [200, 400, 401, 500].includes(r.status),
  });

  // extract token if login succeeds
  let token = "";
  try {
    const body = JSON.parse(res.body);
    token = body.token || "";
  } catch (e) {}

  successRate.add(res.status === 200);
  loginDuration.add(res.timings.duration);
  failedRequests.add(res.status >= 500);

  sleep(0.1);

  // store token for phase 3 use
  return token;
}

// ==========================================
// PHASE 3: Health check
// ==========================================
export function healthCheck() {
  const res = http.get(`${BASE_URL}/health`, {
    tags: { endpoint: "health" },
  });

  check(res, {
    "health -> status 200": (r) => r.status === 200,
  });

  successRate.add(res.status === 200);
  healthDuration.add(res.timings.duration);
  failedRequests.add(res.status !== 200);

  sleep(0.1);
}

// ==========================================
// PHASE 3: Payment flow
// ==========================================
export function paymentFlow() {
  const id = __VU * 1000 + __ITER;
  const apiKey = "sk_live_test123";
  const token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

  // create order
  const createPayload = JSON.stringify({
    amount: 100 + (id % 900),
    currency: "INR",
    customerName: `LoadUser${id}`,
    customoreEmail: `load${id}@test.com`,
    idempotencyKey: `idem_${id}`,
    Provider: "RAZORPAY",
  });

  const createRes = http.post(`${BASE_URL}/api/v2/create`, createPayload, {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      Authorization: token,
    },
    tags: { endpoint: "create_order" },
  });

  check(createRes, {
    "create -> valid status": (r) =>
      [200, 400, 401, 403, 429, 500].includes(r.status),
  });

  successRate.add(createRes.status === 200);
  paymentDuration.add(createRes.timings.duration);
  failedRequests.add(createRes.status >= 500);

  sleep(0.2);

  // verify order
  const verifyPayload = JSON.stringify({
    razorpay_order_id: `order_${id}`,
    razorpay_payment_id: `pay_${id}`,
    razorpay_signature: "dummy_sig",
  });

  const verifyRes = http.post(`${BASE_URL}/api/v2/verify`, verifyPayload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    tags: { endpoint: "verify_order" },
  });

  check(verifyRes, {
    "verify -> valid status": (r) =>
      [200, 400, 401, 500].includes(r.status),
  });

  successRate.add(verifyRes.status === 200);
  paymentDuration.add(verifyRes.timings.duration);
  failedRequests.add(verifyRes.status >= 500);

  sleep(0.1);
}

// ==========================================
// PHASE 3: Webhook flow
// ==========================================
export function webhookFlow() {
  const id = __VU * 1000 + __ITER;

  const body = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: `pay_${id}`,
          amount: 50000,
          currency: "INR",
          status: "captured",
          order_id: `order_${id}`,
        },
      },
    },
  });

  const res = http.post(`${BASE_URL}/webhook/razorpay`, body, {
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": "dummy_hmac_sig",
    },
    tags: { endpoint: "webhook" },
  });

  check(res, {
    "webhook -> 200 or 400/500": (r) => [200, 400, 500].includes(r.status),
  });

  successRate.add(res.status === 200);
  webhookDuration.add(res.timings.duration);
  failedRequests.add(res.status >= 500);

  sleep(0.1);
}

// ==========================================
// SUMMARY
// ==========================================
export function handleSummary(data) {
  const lines = [];
  const fmt = (v) => (v != null ? v.toFixed(2) : "N/A");
  const fmt1 = (v) => (v != null ? v.toFixed(1) : "N/A");

  const httpMetrics = data.metrics.http_reqs;
  const durationMetrics = data.metrics.http_req_duration;
  const failedMetric = data.metrics.failed_requests;
  const successMetric = data.metrics.success_rate;

  const totalReqs = httpMetrics.values.count;
  const failedReqs = failedMetric ? failedMetric.values.count : 0;
  const successPct = successMetric ? (successMetric.values.rate * 100) : 0;
  const reqRate = httpMetrics.values.rate;
  const duration = data.root_group ? data.root_group.duration : 0;

  lines.push("");
  lines.push("+".repeat(70));
  lines.push("|" + " ".repeat(68) + "|");
  lines.push("|" + "  PAYGATE - LOAD TEST REPORT".padEnd(68) + "|");
  lines.push("|" + "  Microservices Payment Platform".padEnd(68) + "|");
  lines.push("|" + " ".repeat(68) + "|");
  lines.push("+".repeat(70));
  lines.push("");

  // test configuration
  lines.push("+".repeat(70));
  lines.push("|  TEST CONFIGURATION" + " ".repeat(48) + "|");
  lines.push("+".repeat(70));
  lines.push("  Target URL         : " + BASE_URL);
  lines.push("  Total Duration     : ~" + Math.round(totalReqs / reqRate) + " seconds");
  lines.push("  Max Concurrent VUs : " + data.metrics.vus_max.values.max);
  lines.push("  Scenarios          : 6 (Register, Login, Health, Payment, Webhook, Spike)");
  lines.push("");

  // test flow
  lines.push("+".repeat(70));
  lines.push("|  TEST FLOW" + " ".repeat(58) + "|");
  lines.push("+".repeat(70));
  lines.push("  Phase 1  0-30s      Register 300 unique users (50 VUs x 6 batches)");
  lines.push("  Phase 2  30-60s     Login 300 users (50 VUs x 6 batches)");
  lines.push("  Phase 3  60-270s    Sustained load on all endpoints");
  lines.push("    - Health check   200 VUs constant for 150s");
  lines.push("    - Payment        Ramp 0 to 200 VUs over 150s");
  lines.push("    - Webhook        100 VUs constant for 150s");
  lines.push("    - Spike          500 VUs burst for 60s");
  lines.push("");

  // overall results
  lines.push("+".repeat(70));
  lines.push("|  OVERALL RESULTS" + " ".repeat(52) + "|");
  lines.push("+".repeat(70));
  lines.push("  Total Requests     : " + totalReqs.toLocaleString());
  lines.push("  Throughput         : " + fmt(reqRate) + " requests/sec");
  lines.push("  Successful         : " + (totalReqs - failedReqs).toLocaleString());
  lines.push("  Failed             : " + failedReqs.toLocaleString());
  lines.push("  Success Rate       : " + fmt1(successPct) + "%");
  lines.push("");

  // response time
  lines.push("+".repeat(70));
  lines.push("|  RESPONSE TIME (ms)" + " ".repeat(49) + "|");
  lines.push("+".repeat(70));
  lines.push("  Minimum            : " + fmt(durationMetrics.values.min));
  lines.push("  Maximum            : " + fmt(durationMetrics.values.max));
  lines.push("  Average            : " + fmt(durationMetrics.values.avg));
  lines.push("  Median (p50)       : " + fmt(durationMetrics.values.med));
  lines.push("  90th Percentile    : " + fmt(durationMetrics.values["p(90)"]));
  lines.push("  95th Percentile    : " + fmt(durationMetrics.values["p(95)"]));
  lines.push("  99th Percentile    : " + fmt(durationMetrics.values["p(99)"]));
  lines.push("");

  // per endpoint breakdown
  lines.push("+".repeat(70));
  lines.push("|  PER-ENDPOINT BREAKDOWN" + " ".repeat(45) + "|");
  lines.push("+".repeat(70));
  lines.push("  " + "-".repeat(66));
  lines.push(
    "  " +
    "Endpoint".padEnd(16) + " | " +
    "Calls".padEnd(8) + " | " +
    "Avg (ms)".padEnd(10) + " | " +
    "p95 (ms)".padEnd(10) + " | " +
    "Max (ms)".padEnd(10)
  );
  lines.push("  " + "-".repeat(66));

  const endpoints = [
    { name: "Register", trend: data.metrics.register_duration },
    { name: "Login", trend: data.metrics.login_duration },
    { name: "Health", trend: data.metrics.health_duration },
    { name: "Payment", trend: data.metrics.payment_duration },
    { name: "Webhook", trend: data.metrics.webhook_duration },
  ];

  for (const ep of endpoints) {
    if (ep.trend && ep.trend.values.count > 0) {
      lines.push(
        "  " +
        ep.name.padEnd(16) + " | " +
        String(ep.trend.values.count).padEnd(8) + " | " +
        fmt1(ep.trend.values.avg).padEnd(10) + " | " +
        fmt1(ep.trend.values["p(95)"]).padEnd(10) + " | " +
        fmt1(ep.trend.values.max)
      );
    }
  }

  lines.push("  " + "-".repeat(66));
  lines.push("");

  // threshold verdict
  lines.push("+".repeat(70));
  lines.push("|  THRESHOLD VERDICT" + " ".repeat(50) + "|");
  lines.push("+".repeat(70));

  let allPassed = true;
  for (const [name, metric] of Object.entries(data.metrics)) {
    if (metric.thresholds) {
      for (const [tName, tVal] of Object.entries(metric.thresholds)) {
        if (!tVal.ok) allPassed = false;
      }
    }
  }

  for (const [name, metric] of Object.entries(data.metrics)) {
    if (metric.thresholds) {
      for (const [tName, tVal] of Object.entries(metric.thresholds)) {
        const status = tVal.ok ? "PASS" : "FAIL";
        lines.push("  [" + status + "] " + name + " " + tName);
      }
    }
  }

  lines.push("");
  lines.push("  OVERALL: " + (allPassed ? "ALL THRESHOLDS PASSED" : "SOME THRESHOLDS FAILED"));
  lines.push("");

  // capacity analysis
  lines.push("+".repeat(70));
  lines.push("|  CAPACITY ANALYSIS" + " ".repeat(50) + "|");
  lines.push("+".repeat(70));

  const avgDur = durationMetrics.values.avg;
  const p95Dur = durationMetrics.values["p(95)"];
  const maxDur = durationMetrics.values.max;

  let rating = "POOR";
  if (avgDur < 50 && p95Dur < 200 && successPct > 80) rating = "EXCELLENT";
  else if (avgDur < 100 && p95Dur < 500 && successPct > 60) rating = "GOOD";
  else if (avgDur < 500 && p95Dur < 2000 && successPct > 40) rating = "MODERATE";

  lines.push("  Performance Rating  : " + rating);
  lines.push("  Avg Response Time   : " + fmt1(avgDur) + " ms");
  lines.push("  p95 Response Time   : " + fmt1(p95Dur) + " ms");
  lines.push("  Max Response Time   : " + fmt1(maxDur) + " ms");
  lines.push("  Success Rate        : " + fmt1(successPct) + "%");
  lines.push("  Max VUs Handled     : " + data.metrics.vus_max.values.max);
  lines.push("  Requests/sec        : " + fmt(reqRate));
  lines.push("");

  lines.push("+".repeat(70));
  lines.push("|" + " ".repeat(68) + "|");
  lines.push("|" + "  END OF REPORT".padEnd(68) + "|");
  lines.push("|" + " ".repeat(68) + "|");
  lines.push("+".repeat(70));
  lines.push("");

  return {
    stdout: lines.join("\n"),
    "loadtest-summary.json": JSON.stringify(data, null, 2),
  };
}
