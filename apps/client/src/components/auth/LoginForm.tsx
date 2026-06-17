import { useState } from 'react';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useToast } from '../../state/ToastContext.js';

interface LoginFormProps {
  onShowRegister: () => void;
}

// Ported from PortMasters2/PortMasters_online.html login() (lines 1899-1928): client-side
// validation (both fields required) before sending the action, server-side validation messages
// surface as toasts exactly as in the original.
export function LoginForm({ onShowRegister }: LoginFormProps) {
  const { tr } = useTranslate();
  const { login } = useSession();
  const { showNotification } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    if (!u || !password) {
      showNotification(tr('请输入用户名和密码', 'Please enter a username and password'), true);
      return;
    }
    login(u, password);
  };

  return (
    <form onSubmit={submit}>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder={tr('用户名', 'Username')}
        autoComplete="username"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder={tr('密码', 'Password')}
        autoComplete="current-password"
      />
      <button type="submit" className="btn btn-success btn-lg">
        {tr('⛵ 登录起航', '⛵ Log In & Set Sail')}
      </button>
      <button type="button" className="btn btn-lg" onClick={onShowRegister}>
        {tr('📝 注册新账号', '📝 Create Account')}
      </button>
    </form>
  );
}
