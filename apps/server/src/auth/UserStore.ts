import { existsSync, readFileSync } from 'node:fs';
import { writeFileAtomic } from '../persistence/atomicWrite.js';
import { generateSalt, hashPassword, verifyPassword } from './passwordHash.js';

// Ported verbatim from PortMasters2/server.py UserStore (lines 1134-1182). created_at keeps its
// snake_case spelling because it's a literal field of the on-disk users.json record, copied
// verbatim from the original as seed data -- not cleaned up to camelCase.
export interface UserRecord {
  salt: string;
  hash: string;
  created_at: string;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

// Mirrors Python's time.strftime("%Y-%m-%d %H:%M:%S") with no explicit time arg, i.e. local time.
function formatTimestamp(d: Date): string {
  const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  return `${date} ${time}`;
}

export class UserStore {
  private readonly path: string;
  private users: Record<string, UserRecord> = {};

  constructor(path: string) {
    this.path = path;
    this.load();
  }

  load(): void {
    if (!existsSync(this.path)) return;
    try {
      this.users = JSON.parse(readFileSync(this.path, 'utf-8')) as Record<string, UserRecord>;
    } catch {
      this.users = {};
    }
  }

  save(): void {
    writeFileAtomic(this.path, JSON.stringify(this.users, null, 2));
  }

  register(username: unknown, password: unknown): [boolean, string] {
    if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
      return [false, '用户名需为 3-20 个字符'];
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
      return [false, '密码需为 6-128 位'];
    }
    if (username in this.users) {
      return [false, '该用户名已被注册'];
    }
    const salt = generateSalt();
    this.users[username] = {
      salt,
      hash: hashPassword(password, salt),
      created_at: formatTimestamp(new Date()),
    };
    this.save();
    return [true, '注册成功，请登录'];
  }

  verify(username: unknown, password: unknown): [boolean, string] {
    if (typeof username !== 'string' || typeof password !== 'string') {
      return [false, '用户名或密码错误'];
    }
    const rec = this.users[username];
    if (!rec || typeof rec.salt !== 'string' || typeof rec.hash !== 'string') {
      return [false, '用户名或密码错误'];
    }
    if (!verifyPassword(password, rec.salt, rec.hash)) {
      return [false, '用户名或密码错误'];
    }
    return [true, '登录成功'];
  }
}
