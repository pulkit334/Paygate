class Animal {
  name: string;
  
  constructor(name: string) {
    this.name = name;
    console.log(`Animal born: ${name}`);
  }
  
  speak() {
    return `${this.name} makes sound`;
  }
}

class Dog extends Animal {
  breed: string;
  
  constructor(name: string, breed: string) {
    super(name); // ⚠️ MUST be first line!
    // If you forget super() → ReferenceError
    this.breed = breed; // Can use 'this' only AFTER super()
    console.log(`Dog specifics: ${breed}`);
  }
  
  speak(): string {
    // Call parent's method + add own logic
    const parentSound = super.speak();
    return  this.breed = "huejdhas"
  }
  
  fetch(): string {
    return `${this.name} fetches ball`;
  }
}

const dog = new Dog("Tommy", "Golden Retriever");
// Output:
// "Animal born: Tommy"     ← parent constructor runs first
// "Dog specifics: Golden Retriever"

console.log(dog.speak()); // "Tommy makes sound and barks!"
console.log(dog.fetch()); // "Tommy fetches ball"