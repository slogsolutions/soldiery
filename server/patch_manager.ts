import fs from 'fs';

const patch = () => {
  const filePath = "src/controllers/manager.ts";
  let content = fs.readFileSync(filePath, "utf-8");

  // In getAllSoldiers - Soldiers query
  content = content.replace(
    /const soldiers = await User\.find\(\{\s+role: "soldier",\s+manager: req\.user!\.id,\s+\.\.\.\(status && \{ status \}\),\s+\}\)\.select\("-password"\);/g,
    `const soldiers = await User.find({
      role: "soldier",
      ...(status && { status }),
    }).select("-password");`
  );

  // In getAllSoldiers - Assignment query
  content = content.replace(
    /const activeAssignment = await Assignment\.findOne\(\{\s+soldier: soldier\._id,\s+manager: req\.user!\.id,\s+startTime: \{ \$lte: now \},\s+endTime: \{ \$gte: now \},\s+status: \{ \$in: \["active", "pending_review"\] \},\s+\}\)\.populate\("task", "title"\);/g,
    `const activeAssignment = await Assignment.findOne({
          soldier: soldier._id,
          startTime: { $lte: now },
          endTime: { $gte: now },
          status: { $in: ["active", "pending_review"] },
        }).populate("task", "title");`
  );

  // In getDashboard - Soldiers query
  content = content.replace(
    /const soldiers = await User\.find\(\{\s+role: "soldier",\s+manager: req\.user!\.id,\s+status: "active",\s+\}\);/g,
    `const soldiers = await User.find({
      role: "soldier",
      status: "active",
    });`
  );

  // In getDashboard - Assignment query
  content = content.replace(
    /const activeAssignments = await Assignment\.find\(\{\s+manager: req\.user!\.id,\s+startTime: \{ \$lte: now \},\s+endTime: \{ \$gte: now \},\s+status: \{ \$in: \["active", "pending_review"\] \},\s+\}\);/g,
    `const activeAssignments = await Assignment.find({
      startTime: { $lte: now },
      endTime: { $gte: now },
      status: { $in: ["active", "pending_review"] },
    });`
  );

  // In getManagerLeaves
  content = content.replace(
    /const leaves = await Leave\.find\(\{\s+manager: req\.user!\.id,\s+\}\)\s+\.populate\("soldier", "name rank armyNumber"\)/g,
    `const leaves = await Leave.find({})
      .populate("soldier", "name rank armyNumber")`
  );

  fs.writeFileSync(filePath, content, "utf-8");
  console.log("manager.ts patched successfully to show entire DB users!");
};

patch();
