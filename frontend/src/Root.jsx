import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function Root() {
  const inner = <App />
  if (!googleClientId) return inner
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      {inner}
    </GoogleOAuthProvider>
  )
}
