import db from "../db.js"; // adjust path if needed

const emailToDelete = "sannimaryam134@gmail.com";

// Delete the user completely
const result = db.prepare("DELETE FROM users WHERE email = ?").run(emailToDelete);

if (result.changes === 0) {
  console.log(`No user found with email: ${emailToDelete}`);
} else {
  console.log(`User with email ${emailToDelete} deleted successfully!`);
}

// Optional: show remaining staff
const staff = db.prepare("SELECT * FROM users").all();
console.log("Remaining users:", staff);
