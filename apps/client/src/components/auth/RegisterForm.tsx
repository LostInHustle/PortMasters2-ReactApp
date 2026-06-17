import { useEffect, useState } from 'react';
import { lst } from '../../i18n/serverTextRules.js';
import { useTranslate } from '../../i18n/useTranslate.js';
import { useSession } from '../../state/SessionContext.js';
import { useToast } from '../../state/ToastContext.js';
import { useWs } from '../../ws/WsContext.js';

interface RegisterFormProps {
  onShowLogin: () => void;
}

// Ported from PortMasters2/PortMasters_online.html register() (lines 1871-1897): the only
// client-side check is password confirmation matching; everything else (length, uniqueness) is
// validated server-side. register_result is handled here (not in SessionContext) since it only
// ever affects this form: a toast, plus switching back to the login view on success.
export function RegisterForm({ onShowLogin }: RegisterFormProps) {
  const { tr, lang } = useTranslate();
  const { subscribe } = useWs();
  const { register } = useSession();
  const { showNotification } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  useEffect(() => {
    return subscribe((msg) => {
      if (msg.type !== 'register_result') return;
      showNotification(lst(msg.message as string, lang), !msg.success);
      if (msg.success) onShowLogin();
    });
  }, [subscribe, showNotification, lang, onShowLogin]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      showNotification(tr('两次密码不一致', 'Passwords do not match'), true);
      return;
    }
    register(username.trim(), password);
  };

  return (
    <form onSubmit={submit}>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder={tr('用户名（3-20 字符）', 'Username (3-20 characters)')}
        autoComplete="username"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder={tr('密码（至少 6 位）', 'Password (6+ characters)')}
        autoComplete="new-password"
      />
      <input
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        type="password"
        placeholder={tr('确认密码', 'Confirm password')}
        autoComplete="new-password"
      />
      <button type="submit" className="btn btn-success btn-lg">
        {tr('✅ 注册', '✅ Register')}
      </button>
      <button type="button" className="btn btn-lg" onClick={onShowLogin}>
        {tr('← 返回登录', '← Back to Login')}
      </button>
    </form>
  );
}
