import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const { searchParams, origin } = requestUrl

    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const next = searchParams.get('next') ?? '/'

    if (errorParam) {
        console.error('Supabase returned error:', errorParam, errorDescription)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(errorParam)}&description=${encodeURIComponent(errorDescription || '')}`)
    }

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Note: setAll can fail if called from a place that doesn't allow setting cookies
                        }
                    },
                },
            }
        )
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
        console.error('Auth exchange error:', JSON.stringify(error, null, 2))
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=exchange_error&message=${encodeURIComponent(error.message)}`)
    }

    console.warn('No code or error in callback URL')
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=no_code`)
}
