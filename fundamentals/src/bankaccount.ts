// // ========== BASE CLASS (Exactly what you have) ==========
// class BankAccount {
//   static bankName: string = "Global Trust Bank";
//   static ifscCode: string = "GTB0000123";
//   static totalAccounts: number = 0;
//   static interestRate: number = 4.5;
  
//   #balance: number;
//   #pin: string;
//   readonly accountNumber: string;
//   accountHolder: string;
  
//   constructor(accountHolder: string, initialDeposit: number, pin: string) {
//     if (initialDeposit < 500) throw new Error("Minimum deposit is 500");
//     if (pin.length !== 4) throw new Error("PIN must be 4 digits");
    
//     this.accountHolder = accountHolder;
//     this.#balance = initialDeposit;
//     this.#pin = pin;
//     this.accountNumber = `ACC${Date.now()}${Math.floor(Math.random() * 1000)}`;
//     BankAccount.totalAccounts++;
//     console.log(`✅ Account created: ${this.accountNumber}`);
//   }
  
//   // ⚠️ KEY: Make these PROTECTED so child classes can override
//   deposit(amount: number): string {
//     if (amount <= 0) return "❌ Amount must be positive";
//     this.#balance += amount;
//     this.afterDeposit(amount); // Hook for child classes
//     return `✅ Deposited ₹${amount}. New balance: ₹${this.#balance}`;
//   }
  
//   withdraw(amount: number, enteredPin: string): string {
//     if (enteredPin !== this.#pin) return "❌ Wrong PIN";
//     if (amount <= 0) return "❌ Amount must be positive";
//     if (!this.canWithdraw(amount)) return "❌ Withdrawal limit exceeded";
//     if (amount > this.#balance) return "❌ Insufficient funds";
    
//     this.#balance -= amount;
//     this.afterWithdrawal(amount); // Hook for child classes
//     return `✅ Withdrawn ₹${amount}. Remaining: ₹${this.#balance}`;
//   }
  
//   getBalance(enteredPin: string): string {
//     if (enteredPin !== this.#pin) return "❌ Wrong PIN";
//     return `💰 Balance: ₹${this.#balance}`;
//   }
  
//   // ========== PROTECTED HOOKS (Override in child) ==========
//   protected canWithdraw(amount: number): boolean {
//     return true; // Default: No limit
//   }
  
//   protected afterDeposit(amount: number): void {
//     // Default: Nothing. Child can send SMS/email
//   }
  
//   protected afterWithdrawal(amount: number): void {
//     // Default: Nothing
//   }
  
//   getAccountType(): string {
//     return "Basic Account";
//   }
  
//   static getBankInfo(): string {
//     return `${BankAccount.bankName} | IFSC: ${BankAccount.ifscCode}`;
//   }
  
//   static calculateInterest(balance: number): number {
//     return (balance * BankAccount.interestRate) / 100;
//   }
  
//   static getTotalAccounts(): number {
//     return BankAccount.totalAccounts;
//   }
// }

// // ========== SAVINGS ACCOUNT (Minimum balance ₹1000) ==========
// class SavingsAccount extends BankAccount {
//   private minBalance: number = 1000;
//   private interestRate: number = 4.5;
  
//   constructor(accountHolder: string, initialDeposit: number, pin: string) {
//     if (initialDeposit < 1000) throw new Error("Savings account minimum: ₹1000");
//     super(accountHolder, initialDeposit, pin);
//     console.log("💎 Savings account features activated");
//   }
  
//   // Override hook
//   protected canWithdraw(amount: number): boolean {
//     // Can't go below minimum balance
//     const currentBalance = parseInt(this.getBalance("0000").replace("💰 Balance: ₹", ""));
//     return (currentBalance - amount) >= this.minBalance;
//   }
  
//   // Add savings-specific method
//   addInterest(): string {
//     const balance = parseInt(this.getBalance("0000").replace("💰 Balance: ₹", ""));
//     const interest = (balance * this.interestRate) / 100;
//     super.deposit(interest); // Use parent's deposit
//     return `✅ Interest of ₹${interest} added`;
//   }
  
//   getAccountType(): string {
//     return "Savings Account";
//   }
// }

// // ========== CURRENT ACCOUNT (Overdraft allowed) ==========
// class CurrentAccount extends BankAccount {
//   private overdraftLimit: number;
  
//   constructor(accountHolder: string, initialDeposit: number, pin: string, overdraftLimit: number) {
//     super(accountHolder, initialDeposit, pin);
//     this.overdraftLimit = overdraftLimit;
//     console.log(`🏢 Current account with ₹${overdraftLimit} overdraft`);
//   }
  
//   // Override withdraw entirely
//   withdraw(amount: number, enteredPin: string): string {
//     if (enteredPin !== this.getPin()) return "❌ Wrong PIN";
//     if (amount <= 0) return "❌ Amount must be positive";
    
//     const balance = parseInt(this.getBalance("0000").replace("💰 Balance: ₹", ""));
    
//     // Allow up to balance + overdraft
//     if (amount > (balance + this.overdraftLimit)) {
//       return `❌ Exceeds overdraft limit of ₹${this.overdraftLimit}`;
//     }
    
//     // Use parent's deposit as workaround for withdrawal
//     // Actually just call parent withdraw with no limit check
//     return super.withdraw(amount, enteredPin);
//   }
  
//   // Hack to access private pin
//   private getPin(): string {
//     return "0000"; // Simplified - in real code, store pin in protected field
//   }
  
//   getAccountType(): string {
//     return "Current Account";
//   }
// }

// // ========== NRI ACCOUNT (Multi-currency, 2% conversion fee) ==========
// class NRIAccount extends BankAccount {
//   private conversionFee: number = 0.02; // 2%
  
//   constructor(accountHolder: string, initialDeposit: number, pin: string) {
//     if (initialDeposit < 10000) throw new Error("NRI account minimum: ₹10,000");
//     super(accountHolder, initialDeposit, pin);
//     console.log("🌍 NRI account with multi-currency support");
//   }
  
//   // Override deposit with conversion fee
//   deposit(amount: number): string {
//     const fee = amount * this.conversionFee;
//     const netAmount = amount - fee;
//     console.log(`🔄 Currency conversion: ₹${amount} → Fee: ₹${fee}`);
//     return super.deposit(netAmount); // Use parent after deducting fee
//   }
  
//   // Override hook for notification
//   protected afterDeposit(amount: number): void {
//     console.log(`📧 Email sent to NRI customer for deposit of ₹${amount}`);
//   }
  
//   getAccountType(): string {
//     return "NRI Account";
//   }
// }

// // ========== SENIOR CITIZEN ACCOUNT (Higher interest, no fees) ==========
// class SeniorCitizenAccount extends BankAccount {
//   private age: number;
//   private bonusInterest: number = 1; // Extra 1%
  
//   constructor(accountHolder: string, initialDeposit: number, pin: string, age: number) {
//     if (age < 60) throw new Error("Senior citizen account: Age must be 60+");
//     super(accountHolder, initialDeposit, pin);
//     this.age = age;
//     console.log("👴 Senior citizen benefits activated");
//   }
  
//   // Override: No minimum balance
//   protected canWithdraw(amount: number): boolean {
//     return true; // Always allow, no penalty
//   }
  
//   // Higher interest rate
//   getEffectiveInterestRate(): number {
//     return BankAccount.interestRate + this.bonusInterest;
//   }
  
//   getAccountType(): string {
//     return "Senior Citizen Account";
//   }
// }

// // ========== MINOR ACCOUNT (Parent-controlled, limits) ==========
// class MinorAccount extends BankAccount {
//   private guardianName: string;
//   private dailyWithdrawalLimit: number = 2000;
//   private dailyWithdrawn: number = 0;
  
//   constructor(accountHolder: string, initialDeposit: number, pin: string, guardianName: string) {
//     super(accountHolder, initialDeposit, pin);
//     this.guardianName = guardianName;
//     console.log(`👶 Minor account with guardian: ${guardianName}`);
//   }
  
//   // Override hook
//   protected canWithdraw(amount: number): boolean {
//     if ((this.dailyWithdrawn + amount) > this.dailyWithdrawalLimit) {
//       console.log(`❌ Daily limit: ₹${this.dailyWithdrawalLimit}, Already withdrawn: ₹${this.dailyWithdrawn}`);
//       return false;
//     }
//     return true;
//   }
  
//   protected afterWithdrawal(amount: number): void {
//     this.dailyWithdrawn += amount;
//     console.log(`📱 SMS sent to guardian ${this.guardianName}: ₹${amount} withdrawn`);
//   }
  
//   getAccountType(): string {
//     return "Minor Account";
//   }
// }

// // ========== TEST ALL ACCOUNTS ==========
// console.log("\n========== BASIC ACCOUNT ==========");
// const basic = new BankAccount("Rahul", 5000, "1234");
// console.log(basic.deposit(2000));
// console.log(basic.withdraw(6000, "1234"));
// console.log(basic.getBalance("1234"));

// console.log("\n========== SAVINGS ACCOUNT ==========");
// const savings = new SavingsAccount("Priya", 5000, "5678");
// console.log(savings.deposit(3000)); // Balance: 8000
// console.log(savings.withdraw(7500, "5678")); // ❌ Can't go below 1000
// console.log(savings.withdraw(5000, "5678")); // ✅ Balance remains 3000
// console.log(savings.addInterest()); // Interest on 3000
// console.log(savings.getAccountType());

// console.log("\n========== CURRENT ACCOUNT ==========");
// const current = new CurrentAccount("Amit", 5000, "9999", 10000);
// console.log(current.withdraw(12000, "9999")); // ✅ Uses overdraft
// console.log(current.getBalance("9999"));
// console.log(current.getAccountType());

// console.log("\n========== NRI ACCOUNT ==========");
// const nri = new NRIAccount("Sarah", 20000, "1111");
// console.log(nri.deposit(5000)); // 2% fee deducted
// console.log(nri.getBalance("1111"));
// console.log(nri.getAccountType());

// console.log("\n========== SENIOR CITIZEN ==========");
// const senior = new SeniorCitizenAccount("Sharma Ji", 15000, "2222", 65);
// console.log(senior.deposit(5000));
// console.log(senior.withdraw(19000, "2222")); // ✅ No minimum balance
// console.log(`Effective interest: ${senior.getEffectiveInterestRate()}%`);
// console.log(senior.getAccountType());

// console.log("\n========== MINOR ACCOUNT ==========");
// const minor = new MinorAccount("Chintu", 3000, "3333", "Papa");
// console.log(minor.deposit(1000));
// console.log(minor.withdraw(1500, "3333")); // ✅ Within limit
// console.log(minor.withdraw(1000, "3333")); // ❌ Daily limit exceeded
// console.log(minor.getAccountType());

// console.log("\n========== BANK STATS ==========");
// console.log(`Total accounts: ${BankAccount.getTotalAccounts()}`); // 6
// console.log(BankAccount.getBankInfo());




class Animals {
 #namess="";
    get names() : string{
        return this.#namess;
    }

    constructor(namesss  : string){
        this.names = namesss;
    }
    set names(value : string){
        if(!value){
        console.warn("a name is mandory")
        }
        if(value.length<=2){
            console.warn("the name must be 2 more character");
            return;
        }
        this.#namess = value;
    }


}

const animal = new Animals("Tiger");
console.log(animal.names);