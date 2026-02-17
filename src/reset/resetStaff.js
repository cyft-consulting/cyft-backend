// resetStaff.js
import db from "../db.js"; // adjust path if needed

// Show all staff before deleting
const staffBefore = db.prepare("SELECT * FROM users WHERE role = 'STAFF'").all();
console.log("Staff before deletion:", staffBefore);

// Delete all staff
const result = db.prepare("DELETE FROM users WHERE role = 'STAFF'").run();
console.log(`Deleted ${result.changes} staff rows.`);

// Show remaining staff
const staffAfter = db.prepare("SELECT * FROM users WHERE role = 'STAFF'").all();
console.log("Staff after deletion:", staffAfter);
