'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Calculator,
  BarChart3,
  Plus,
  FolderOpen,
  TrendingUp,
  LogOut,
  User,
  Upload,
  Target,
  Brain,
} from 'lucide-react';
import { SimpleDropdown, DropdownItem } from '@/components/ui/simple-dropdown';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/dashboard',
    label: 'Scenarios',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/investments',
    label: 'Investment Strategy',
    icon: Target,
  },
  {
    href: '/dashboard/financial-analysis',
    label: 'Financial Analysis',
    icon: BarChart3,
  },
  {
    href: '/dashboard/compare',
    label: 'Compare Scenarios',
    icon: Calculator,
  },
];

export default function DashboardNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = async () => {
    console.log('Logout clicked');
    await logout();
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
    alert('Profile page coming soon!');
  };

  return (
    <div className='border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          <div className='flex items-center'>
            {/* Logo */}
            <div className='flex items-center space-x-4 mr-6'>
              <Link href='/dashboard' className='flex items-center space-x-2'>
                <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
                  <TrendingUp className='w-5 h-5 text-primary-foreground' />
                </div>
                <span className='text-xl font-bold text-foreground'>
                  Cashflow Compass
                </span>
              </Link>
            </div>
            {/* Tab Navigation */}
            <nav className='hidden md:flex items-center space-x-1'>
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant='ghost'
                      className={cn(
                        'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <Icon className='w-4 h-4' />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Actions */}
          <div className='flex items-center'>
            <SimpleDropdown
              trigger={
                <Button
                  variant='ghost'
                  size='icon'
                  className='rounded-full hover:bg-accent'
                  aria-label='User menu'
                >
                  <User className='w-5 h-5' />
                </Button>
              }
              align='right'
            >
              <DropdownItem onClick={handleProfileClick}>
                <User className='w-4 h-4 mr-2' />
                <span>Profile</span>
              </DropdownItem>
              <DropdownItem onClick={handleLogout}>
                <LogOut className='w-4 h-4 mr-2' />
                <span>Logout</span>
              </DropdownItem>
            </SimpleDropdown>
          </div>
        </div>
      </div>
    </div>
  );
}
