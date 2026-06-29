import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Images,
  Upload,
  Search,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/gallery', label: 'Gallery', icon: Images },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/search', label: 'Search', icon: Search },
]

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/gallery"
            className="flex items-center gap-2 text-black hover:opacity-80 transition-opacity font-bold text-lg"
          >
            TravelVault
          </Link>

          {/* Desktop Nav */}
          {user && (
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = location.pathname.startsWith(to)
                return (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center gap-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'text-black'
                        : 'text-gray-600 hover:text-black'
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-4">
            {user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Open profile menu"
                  aria-expanded={profileOpen}
                >
                  <Avatar
                    src={profile.avatar_url}
                    name={profile.display_name}
                    size="sm"
                  />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileOpen(false)}
                      />
                      <motion.div
                        className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20"
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-medium text-black truncate">
                            {profile.display_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {profile.email}
                          </p>
                        </div>

                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-black hover:bg-gray-50 transition-colors"
                        >
                          <User className="size-4" />
                          Profile
                        </Link>

                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-black hover:bg-gray-50 transition-colors border-t border-gray-200"
                        >
                          <LogOut className="size-4" />
                          Sign out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              !user && (
                <Link to="/login">
                  <Button size="sm" className="bg-black text-white hover:bg-gray-800">Sign in</Button>
                </Link>
              )
            )}

            {/* Mobile menu toggle */}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden size-10 p-0 hover:bg-gray-100"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && user && (
          <motion.div
            className="md:hidden bg-white border-b border-gray-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="px-4 py-3 flex flex-col gap-1" aria-label="Mobile navigation">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = location.pathname.startsWith(to)
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      active
                        ? 'bg-gray-200 text-black'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
