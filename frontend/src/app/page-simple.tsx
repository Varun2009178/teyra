'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';

export default function SimpleHomePage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-t-white border-gray-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-300">loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Simple Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center space-x-3">
              <Image 
                src="/teyra-logo-64kb.png" 
                alt="Teyra" 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold">teyra</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link href="/dashboard">
                    <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors">
                      dashboard
                    </button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/sign-in">
                    <button className="px-4 py-2 text-white hover:text-gray-300 transition-colors">
                      sign in
                    </button>
                  </Link>
                  <Link href="/sign-up">
                    <button className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors">
                      get started
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Simple Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Productivity is{' '}
            <span className="text-green-400">Broken</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {user ? (
              "Welcome back! Ready to continue your productivity journey?"
            ) : (
              "So we made it honest, sustainable, and overwhelmingly easy"
            )}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Link href="/dashboard">
                <button className="px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  open dashboard
                </button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <button className="px-8 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium">
                    get started
                  </button>
                </Link>
                <Link href="/sign-in">
                  <button className="px-8 py-3 border border-white text-white rounded-lg hover:bg-white/10 transition-colors">
                    sign in
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Simple Mike Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">meet mike</h2>
          <p className="text-gray-300 mb-8">your emotional support cactus</p>
          
          <div className="flex justify-center mb-8">
            <Image 
              src="/Neutral Calm.gif" 
              alt="Mike the Cactus" 
              width={120} 
              height={120}
              className="rounded-full"
            />
          </div>
          
          <p className="text-gray-300 max-w-2xl mx-auto">
            Mike understands your feelings, celebrates your wins, and helps you stay productive without the guilt.
          </p>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm border-t border-white/10">
        <p>&copy; {new Date().getFullYear()} teyra. crafted with care for human productivity.</p>
      </footer>
    </div>
  );
}



