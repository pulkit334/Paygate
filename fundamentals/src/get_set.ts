class Temperature {
  private _celsius: number = 0;
  
  // GETTER - runs when reading .celsius
  get celsius(): number {
    console.log("Someone asked for celsius");
    return this._celsius;
  }
  
  // SETTER - runs when writing .celsius = value
  set celsius(value: number) {
    console.log("Someone is setting celsius");
    if (value < -273.15) {
      throw new Error("Below absolute zero!");
    }
    this._celsius = value;
  }
  
  // GETTER ONLY - computed, can't be set
  get fahrenheit(): number {
    return (this._celsius * 9/5) + 32;
  }
  
  // READ-ONLY getter
  get kelvin(): number {
    return this._celsius + 273.15;
  }
}

const temp = new Temperature();

// Looks like property, but runs setter code
temp.celsius = 25;        // "Someone is setting celsius"

// Looks like property, but runs getter code
console.log(temp.celsius); // "Someone asked for celsius" → 25

// Computed - no backing field needed!
console.log(temp.fahrenheit); // 77 (calculated on the fly)
console.log(temp.kelvin);     // 298.15

// temp.fahrenheit = 100; // ❌ Error! No setter defined
// temp.celsius = -300;    // ❌ Error! "Below absolute zero!"