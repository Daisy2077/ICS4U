const prompt = require('prompt-sync')();

let budget = parseFloat(prompt("Enter your budget: "));
let expenses = [];

function addExpense(amount, category) {
    expenses.push({ amount, category });
    console.log(`Added expense: $${amount.toFixed(2)} for ${category}`);
}

function calculateTotal() {
    let total = 0;
    for (let expense of expenses) {
        total += expense.amount;
    }
    return total;
}

function checkBudget() {
    const total = calculateTotal();
    if (total > budget) {
        console.log(`You are over budget by $${(total - budget).toFixed(2)}`);
    } else {
        console.log(`You are within budget. Remaining: $${(budget - total).toFixed(2)}`);
    }
}

function removeExpense(category) {
    const index = expenses.findIndex(exp => exp.category.toLowerCase() === category.toLowerCase());
    if (index !== -1) {
        const removed = expenses.splice(index, 1)[0];
        console.log(`Removed expense: $${removed.amount.toFixed(2)} for ${removed.category}`);
    } else {
        console.log(`No expense found for category "${category}"`);
    }
}

while (true) {
    console.log("\n=== Budget Tracker Menu ===");
    console.log("1. Add an Expense");
    console.log("2. View Total Expenses");
    console.log("3. Check Budget");
    console.log("4. Remove an Expense");
    console.log("5. Exit");

    const choice = prompt("Choose an option (1-5): ");

    if (choice === "1") {
        const amount = parseFloat(prompt("Enter expense amount: "));
        const category = prompt("Enter expense category: ");
        if (!isNaN(amount) && category.trim() !== "") {
            addExpense(amount, category);
        } else {
            console.log("Invalid input. Please try again.");
        }
    } 
    else if (choice === "2") {
        console.log(`Total expenses so far: $${calculateTotal().toFixed(2)}`);
    } 
    else if (choice === "3") {
        checkBudget();
    } 
    else if (choice === "4") {
        const category = prompt("Enter the category to remove: ");
        removeExpense(category);
    } 
    else if (choice === "5") {
        console.log("Exiting program. Goodbye.");
        break;
    } 
    else {
        console.log("Invalid option. Please enter a number between 1 and 5.");
    }
}
