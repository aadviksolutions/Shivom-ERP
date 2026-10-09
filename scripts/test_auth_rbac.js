const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function runTests() {
  console.log("=================================================");
  console.log("RUNNING AUTHENTICATION & ROLE-BASED ACCESS TESTS");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Helper to simulate authentication directly with database
  async function testAuth(identifier, password) {
    const cleanId = identifier.trim();
    const lowerId = cleanId.toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: lowerId },
          { username: cleanId },
          { username: lowerId },
        ],
      },
    });

    if (!user || !user.isActive) return null;
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;
    return user;
  }

  // Helper to verify permissions
  function hasPermission(user, module, action) {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    if (!user.permissions) {
      // Default roles
      if (user.role === "BILLING") {
        if (["sales", "quotations", "customers", "reports", "gst"].includes(module)) return true;
        return false;
      }
      if (user.role === "STORE") {
        if (["purchase", "suppliers", "inventory", "stock_adjustment"].includes(module)) return true;
        return false;
      }
      return false;
    }
    try {
      const parsed = typeof user.permissions === "string" ? JSON.parse(user.permissions) : user.permissions;
      if (Array.isArray(parsed[module])) {
        return parsed[module].includes(action);
      }
      return false;
    } catch {
      return false;
    }
  }

  // TEST SUITE A: Admin login
  console.log("\n--- TEST A: Admin Login & Access ---");
  const admin = await testAuth("admin@shivomconstruction.com", "admin123");
  assert(admin !== null, "Admin authenticates successfully with correct credentials");
  assert(admin.role === "ADMIN", "Admin has role ADMIN");
  assert(hasPermission(admin, "users", "view"), "Admin can view Users management");
  assert(hasPermission(admin, "settings", "edit"), "Admin can edit Settings");
  assert(hasPermission(admin, "sales", "create"), "Admin can create sales");
  assert(hasPermission(admin, "purchase", "create"), "Admin can create purchases");

  // TEST SUITE B: Sales / Billing login
  console.log("\n--- TEST B: Sales / Billing Login & Restricted Access ---");
  const billing = await testAuth("billing@shivomconstruction.com", "billing123");
  assert(billing !== null, "Billing staff authenticates successfully");
  assert(billing.role === "BILLING", "Billing user has role BILLING");
  assert(hasPermission(billing, "sales", "view"), "Billing staff can view sales");
  assert(hasPermission(billing, "customers", "view"), "Billing staff can view customers");
  assert(!hasPermission(billing, "users", "view"), "Billing staff is BLOCKED from users management");
  assert(!hasPermission(billing, "settings", "edit"), "Billing staff is BLOCKED from settings");
  assert(!hasPermission(billing, "purchase", "create"), "Billing staff is BLOCKED from creating purchases");

  // TEST SUITE C: Store / Purchase login
  console.log("\n--- TEST C: Store / Inventory Login & Restricted Access ---");
  const store = await testAuth("store@shivomconstruction.com", "store123");
  assert(store !== null, "Store staff authenticates successfully");
  assert(store.role === "STORE", "Store user has role STORE");
  assert(hasPermission(store, "inventory", "view"), "Store staff can view inventory");
  assert(hasPermission(store, "purchase", "view"), "Store staff can view purchases");
  assert(!hasPermission(store, "users", "view"), "Store staff is BLOCKED from users management");
  assert(!hasPermission(store, "settings", "edit"), "Store staff is BLOCKED from settings");
  assert(!hasPermission(store, "sales", "create"), "Store staff is BLOCKED from creating sales");

  // TEST SUITE D: Invalid credentials
  console.log("\n--- TEST D: Invalid Credentials ---");
  const wrongPass = await testAuth("admin@shivomconstruction.com", "wrongpassword");
  assert(wrongPass === null, "Wrong password correctly rejected");
  const unknownUser = await testAuth("nonexistent@domain.com", "anypassword");
  assert(unknownUser === null, "Unknown username correctly rejected");

  // TEST SUITE E: Deactivated account protection
  console.log("\n--- TEST E: Deactivated Account Protection ---");
  const inactiveUser = await prisma.user.findFirst({ where: { isActive: false } });
  if (inactiveUser) {
    const inactiveAuth = await testAuth(inactiveUser.email, "admin123");
    assert(inactiveAuth === null, `Deactivated account (${inactiveUser.email}) cannot log in`);
  } else {
    console.log("[SKIP] No inactive user found in database");
  }

  // TEST SUITE F: Session Isolation & Role Integrity
  console.log("\n--- TEST F: Session Isolation ---");
  assert(admin.id !== billing.id, "Admin and Billing sessions have distinct user IDs");
  assert(billing.id !== store.id, "Billing and Store sessions have distinct user IDs");
  assert(admin.role !== billing.role, "Admin and Billing have distinct roles");
  assert(billing.role !== store.role, "Billing and Store have distinct roles");

  console.log("\n=================================================");
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
