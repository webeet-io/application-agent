export async function register() {
  if (process.env.NODE_ENV === 'development') {
    console.log('\x1b[36m%s\x1b[0m', '📧  Dev emails (Inbucket) → http://localhost:54324/')
  }
}
