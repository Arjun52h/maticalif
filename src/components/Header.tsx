import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SearchOverlay from "@/components/SearchOverlay";

interface HeaderProps {
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenCart, onOpenAuth }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  // theme toggle
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // scroll shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Categories', path: '/categories' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  // 🔍 global search = go to /shop, where all product search happens
  const handleSearchClick = () => {
    navigate('/shop');
  };

  // ❤️ wishlist → auth if not logged in, otherwise go to /wishlist (you can build that page later)
  const handleWishlistClick = () => {
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    navigate('/wishlist');
  };

  const handleSearchSubmit = (query: string) => {
    navigate(`/shop?q=${encodeURIComponent(query)}`);
  };


  return (
    <header
      // className={cn(
      //   "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      //   isScrolled
      //     ? "bg-background/95 backdrop-blur-md shadow-soft"
      //     : "bg-transparent"
      // )}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-xl",
        isScrolled || isSearchOpen
          ? "bg-background/70 shadow-soft border-b border-border/40"
          : "bg-transparent"
      )}

    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <span className="font-display text-primary-foreground text-xl font-bold">M</span>
            </div>
            <span className="font-display text-2xl font-semibold text-foreground">
              Matica.life
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "nav-link text-sm font-medium uppercase tracking-wide",
                  location.pathname === link.path && "text-primary"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search - Desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:flex hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Search className="w-5 h-5" />
            </Button>


            {/* Wishlist - Desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleWishlistClick}
              className="hidden md:flex hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Heart className="w-5 h-5" />
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenCart}
              className="relative hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </Button>

            {/* User */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-primary/10"
                  onClick={() => { }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {user?.name?.split(' ')[0]}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenAuth}
                className="hidden md:flex hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <User className="w-5 h-5" />
              </Button>
            )}

            {/* Theme toggle – desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="hidden md:flex hover:bg-primary/10 transition-colors"
            >
              {isDarkMode ? '🌙' : '☀️'}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden hover:bg-primary/10"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden absolute top-full left-0 right-0 bg-background border-b border-border overflow-hidden transition-all duration-300",
          isMenuOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
          {/* Nav Links */}
          {navLinks.map((link, index) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                "py-3 px-4 rounded-lg text-foreground hover:bg-primary/10 hover:text-primary transition-colors font-medium",
                location.pathname === link.path && "bg-primary/10 text-primary"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {link.name}
            </Link>
          ))}

          <div className="h-px bg-border my-2" />

          {/* Search & Dark Mode (Mobile) */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
              Search products
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </Button>
          </div>

          <div className="h-px bg-border my-2" />

          {/* Auth Section */}
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 py-3 px-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={logout}
                className="w-full border-primary/30 hover:bg-primary hover:text-primary-foreground"
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              onClick={onOpenAuth}
              className="w-full btn-primary"
            >
              Login / Sign Up
            </Button>
          )}
        </nav>
      </div>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearchSubmit}
      />

    </header>
  );
};

export default Header;
