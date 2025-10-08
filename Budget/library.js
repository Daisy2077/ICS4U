let library = [
  { title: "Book A", author: "Author A", year: 2001, isAvailable: true },
  { title: "Book B", author: "Author B", year: 1999, isAvailable: true },
  { title: "Book C", author: "Author C", year: 2010, isAvailable: true }
];

const prompt = require("prompt-sync")();
let running = true;

while (running) {
  console.log("\n1. Add Book");
  console.log("2. List Available Books");
  console.log("3. Borrow Book");
  console.log("4. Return Book");
  console.log("5. List Books by Author");
  console.log("6. Find Books Before Year");
  console.log("7. Remove Book");
  console.log("8. Exit");
  let choice = prompt("Enter choice: ");

  if (choice == "1") {
    let title = prompt("Enter title: ");
    let author = prompt("Enter author: ");
    let year = Number(prompt("Enter year: "));
    library.push({ title, author, year, isAvailable: true });
    console.log("Book added.");
  } 
  else if (choice == "2") {
    console.log("Available books:");
    for (let b of library) {
      if (b.isAvailable) console.log(b.title);
    }
  } 
  else if (choice == "3") {
    let title = prompt("Enter book title to borrow: ");
    let book = library.find(b => b.title === title);
    if (book && book.isAvailable) {
      book.isAvailable = false;
      console.log("Book borrowed.");
    } else console.log("Book unavailable.");
  } 
  else if (choice == "4") {
    let title = prompt("Enter book title to return: ");
    let book = library.find(b => b.title === title);
    if (book) {
      book.isAvailable = true;
      console.log("Book returned.");
    } else console.log("Book not found.");
  } 
  else if (choice == "5") {
    let author = prompt("Enter author: ");
    console.log("Books by " + author + ":");
    for (let b of library) {
      if (b.author === author) console.log(b.title);
    }
  } 
  else if (choice == "6") {
    let year = Number(prompt("Enter year: "));
    console.log("Books published before " + year + ":");
    for (let b of library) {
      if (b.year < year) console.log(b.title);
    }
  } 
  else if (choice == "7") {
    let title = prompt("Enter book title to remove: ");
    let index = library.findIndex(b => b.title === title);
    if (index !== -1) {
      library.splice(index, 1);
      console.log("Book removed.");
    } else console.log("Book not found.");
  } 
  else if (choice == "8") {
    running = false;
    console.log("Exiting...");
  } 
  else {
    console.log("Invalid choice.");
  }
}
