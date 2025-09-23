"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Car,
  LogIn,
  LogOut,
  PlusCircle,
  Search,
  User,
  UserPlus,
  LayoutDashboard,
  Bell,
  ArrowLeftRight,
  XCircle,
  HandCoins,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-provider';
import { Button } from '@/components/ui/button';
import { auth } from '@/config/firebase';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useNotifications,
  type NotificationEntry,
  type NotificationType,
} from '@/contexts/notification-provider';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const notificationIcons: Record<NotificationType, { Icon: LucideIcon; className: string }> = {
  "new-request": { Icon: HandCoins, className: "text-primary" },
  "counter-offer": { Icon: ArrowLeftRight, className: "text-amber-500" },
  rejection: { Icon: XCircle, className: "text-destructive" },
};

export function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  const latestNotifications = notifications.slice(0, 10);

  const handleNotificationsOpenChange = (open: boolean) => {
    setIsNotificationsOpen(open);
  };

  const buildNotificationUrl = (notification: NotificationEntry) => {
    const params = new URLSearchParams();
    params.set('notificacion', notification.id);
    if (notification.requestId) {
      params.set('solicitud', notification.requestId);
    }
    if (notification.rideId) {
      params.set('viaje', notification.rideId);
    }

    const queryString = params.toString();

    if (notification.source === 'driver') {
      return `/dashboard/conductor${queryString ? `?${queryString}` : ''}`;
    }

    if (notification.source === 'passenger') {
      return `/dashboard/pasajero${queryString ? `?${queryString}` : ''}`;
    }

    return '/';
  };

  const handleNotificationClick = (notification: NotificationEntry) => {
    markAsRead(notification.id);
    setIsNotificationsOpen(false);

    const targetUrl = buildNotificationUrl(notification);
    router.push(targetUrl);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error al cerrar sesión: ", error);
      toast({
        title: "No se pudo cerrar sesión",
        description: "Intentá nuevamente en unos instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <nav className="bg-card shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Car className="h-8 w-8" />
            <span className="text-xl font-bold">Rueda Compartida</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/buscar-viajes">
                <Search className="mr-2 h-4 w-4" />
                Buscar Viajes
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/crear-viaje">
                <PlusCircle className="mr-2 h-4 w-4" />
                Ofrecer Viaje
              </Link>
            </Button>
            
            {user ? (
              <>
                <DropdownMenu
                  open={isNotificationsOpen}
                  onOpenChange={handleNotificationsOpenChange}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative h-10 w-10 rounded-full"
                      aria-label={
                        unreadCount > 0
                          ? `Tenés ${unreadCount} notificaciones sin leer`
                          : "Notificaciones"
                      }
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-80 p-0"
                    align="end"
                    sideOffset={12}
                    forceMount
                  >
                    <DropdownMenuLabel className="flex items-center justify-between px-4 py-3 font-semibold">
                      <span>Notificaciones</span>
                      {unreadCount > 0 ? (
                        <span className="text-xs text-destructive">
                          {unreadCount} nuevas
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Al día</span>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {latestNotifications.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        No tenés notificaciones por ahora.
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto py-1">
                        {latestNotifications.map((notification) => {
                          const iconConfig = notificationIcons[notification.type];
                          const IconComponent = iconConfig.Icon;
                          const relativeTime = formatDistanceToNow(
                            notification.createdAt,
                            { addSuffix: true, locale: es },
                          );

                          return (
                            <button
                              key={notification.id}
                              type="button"
                              onClick={() => handleNotificationClick(notification)}
                              className={cn(
                                "flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors",
                                notification.read
                                  ? "hover:bg-muted/60"
                                  : "bg-muted/60 hover:bg-muted",
                              )}
                            >
                              <div className="mt-0.5">
                                <div
                                  className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full",
                                    notification.read
                                      ? "bg-muted text-muted-foreground"
                                      : "bg-background",
                                  )}
                                >
                                  <IconComponent
                                    className={cn(
                                      "h-4 w-4",
                                      iconConfig.className,
                                    )}
                                  />
                                </div>
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className="font-medium leading-tight">
                                  {notification.title}
                                </p>
                                <p className="text-xs leading-snug text-muted-foreground">
                                  {notification.description}
                                </p>
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  {relativeTime}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "Usuario"} />
                        <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.displayName || "Usuario"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/conductor">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Panel del Conductor
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/pasajero">
                        <User className="mr-2 h-4 w-4" />
                        Panel del Pasajero
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer"
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="mr-2 h-4 w-4" />
                      )}
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/login">
                    <LogIn className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </Link>
                </Button>
                <Button size="sm" asChild className="hidden sm:inline-flex">
                  <Link href="/register">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrate
                  </Link>
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="sm:hidden">
                <Button variant="ghost" size="icon" aria-label="Abrir el menú de navegación">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-56 space-y-1 p-2 sm:hidden">
                <DropdownMenuItem asChild className="p-0">
                  <Link
                    href="/buscar-viajes"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
                    aria-label="Ir a la página para buscar viajes disponibles"
                  >
                    <Search className="h-4 w-4" />
                    Buscar Viajes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link
                    href="/crear-viaje"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
                    aria-label="Ir a la página para ofrecer un nuevo viaje"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Ofrecer Viaje
                  </Link>
                </DropdownMenuItem>
                {!user && (
                  <>
                    <DropdownMenuItem asChild className="p-0">
                      <Link
                        href="/login"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
                        aria-label="Ir a la página para iniciar sesión"
                      >
                        <LogIn className="h-4 w-4" />
                        Iniciar Sesión
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="p-0">
                      <Link
                        href="/register"
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
                        aria-label="Ir a la página para registrarse"
                      >
                        <UserPlus className="h-4 w-4" />
                        Registrate
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}