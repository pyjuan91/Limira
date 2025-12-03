import { useNavigate } from 'react-router-dom'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-navy-50/40 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-semibold text-neutral-900 mb-4 tracking-tight">
            Limira
          </h1>
          <p className="text-xl text-neutral-600 font-medium">
            AI-Powered Patent Disclosure Platform
          </p>
        </div>

        {/* Login Type Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Inventor Login Card */}
          <div
            onClick={() => navigate('/login/inventor')}
            className="group relative bg-white rounded-3xl p-12 cursor-pointer
                       border-2 border-neutral-100
                       hover:border-primary-300 hover:shadow-large
                       transition-all duration-300 ease-out
                       hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Icon */}
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6
                            group-hover:bg-primary-600 transition-colors duration-300">
              <svg
                className="w-8 h-8 text-primary-600 group-hover:text-white transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
              Inventor Portal
            </h2>
            <p className="text-neutral-600 mb-6 leading-relaxed">
              Submit your technical disclosures and collaborate with patent attorneys to transform your
              innovations into professional patent applications.
            </p>

            <div className="flex items-center text-primary-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
              Sign in as Inventor
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* Attorney Login Card */}
          <div
            onClick={() => navigate('/login/attorney')}
            className="group relative bg-white rounded-3xl p-12 cursor-pointer
                       border-2 border-neutral-100
                       hover:border-navy-300 hover:shadow-large
                       transition-all duration-300 ease-out
                       hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Icon */}
            <div className="w-16 h-16 bg-navy-100 rounded-2xl flex items-center justify-center mb-6
                            group-hover:bg-navy-700 transition-colors duration-300">
              <svg
                className="w-8 h-8 text-navy-700 group-hover:text-white transition-colors duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
              Attorney Portal
            </h2>
            <p className="text-neutral-600 mb-6 leading-relaxed">
              Review AI-generated patent drafts, provide expert guidance, and collaborate with inventors
              to craft comprehensive patent applications.
            </p>

            <div className="flex items-center text-navy-700 font-medium group-hover:translate-x-2 transition-transform duration-300">
              Sign in as Attorney
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-neutral-500 text-sm">
            Secure, compliant, and designed for professional patent workflows
          </p>
        </div>
      </div>
    </div>
  )
}
