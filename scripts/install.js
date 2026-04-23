#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const TARGET_ROOT = path.join(os.homedir(), '.agents', 'skills');
const SKILLS_SRC = path.join(__dirname, '..', 'skills');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function installSkill(skillName) {
  const src = path.join(SKILLS_SRC, skillName);
  const dest = path.join(TARGET_ROOT, skillName);
  fs.cpSync(src, dest, { recursive: true, force: true });
  console.log(`  ✓ ${skillName}`);
}

ensureDir(TARGET_ROOT);

const skills = fs.readdirSync(SKILLS_SRC).filter(name => {
  return fs.statSync(path.join(SKILLS_SRC, name)).isDirectory();
});

console.log(`Installing ${skills.length} skill(s) to ${TARGET_ROOT}\n`);

for (const skill of skills) {
  installSkill(skill);
}

console.log('\nDone.');
