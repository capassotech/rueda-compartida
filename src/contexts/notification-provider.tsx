"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/auth-provider";
import type { RideRequest } from "@/types";
import {
  subscribeToDriverRequests,
  subscribeToPassengerRequests,
} from "@/lib/firestore-rides";
import { useToast } from "@/hooks/use-toast";

const MAX_NOTIFICATIONS = 30;
const LAST_SEEN_STORAGE_KEY = "rc:last-seen";
const LAST_SEEN_FALLBACK = 0;

export type NotificationType = "new-request" | "counter-offer" | "rejection";
export type NotificationSource = "driver" | "passenger";

export type NotificationEntry = {
  id: string;
  type: NotificationType;
  source: NotificationSource;
  title: string;
  description: string;
  createdAt: Date;
  read: boolean;
  requestId?: string;
  rideId?: string;
};

interface NotificationContextValue {
  notifications: NotificationEntry[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (notificationId: string) => void;
}

const NotificationContext =
  createContext<NotificationContextValue | undefined>(undefined);

const currencyFormatter =
  typeof Intl !== "undefined"
    ? new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      })
    : null;

function formatCurrency(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "$0";
  }

  return currencyFormatter
    ? currencyFormatter.format(value)
    : `$${value.toFixed(0)}`;
}

function resolveEventDate(request: RideRequest) {
  return (
    request.statusUpdatedAt ??
    request.createdAt ??
    new Date()
  );
}

function buildNotificationId(
  request: RideRequest,
  type: NotificationType,
  timestamp: number,
) {
  const baseId = request.id || request.requestKey || `${request.rideId}-${type}`;
  return `${baseId}:${type}:${timestamp}`;
}

function loadLastSeen(uid: string, role: NotificationSource) {
  if (typeof window === "undefined") return LAST_SEEN_FALLBACK;
  const stored = window.localStorage.getItem(
    `${LAST_SEEN_STORAGE_KEY}:${uid}:${role}`,
  );
  if (!stored) return LAST_SEEN_FALLBACK;
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? parsed : LAST_SEEN_FALLBACK;
}

function persistLastSeen(uid: string, role: NotificationSource, value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${LAST_SEEN_STORAGE_KEY}:${uid}:${role}`,
    value.toString(),
  );
}

function triggerBrowserNotification(entry: NotificationEntry) {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;

  if (window.Notification.permission === "granted") {
    new window.Notification(entry.title, {
      body: entry.description,
      tag: entry.id,
    });
    return true;
  }

  if (window.Notification.permission === "default") {
    window.Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new window.Notification(entry.title, {
          body: entry.description,
          tag: entry.id,
        });
      }
    });
  }

  return false;
}

function createDriverPendingNotification(request: RideRequest): NotificationEntry {
  const eventDate = resolveEventDate(request);
  const timestamp = eventDate.getTime();
  const isUpdatedOffer =
    request.statusUpdatedAt &&
    request.createdAt &&
    request.statusUpdatedAt.getTime() > request.createdAt.getTime();
  const passengerName = request.passengerName || "Un pasajero";
  const route =
    request.origin && request.destination
      ? `para el viaje de ${request.origin} a ${request.destination}`
      : "para tu viaje";
  const price = formatCurrency(request.offeredPrice ?? request.price ?? null);
  const type: NotificationType = isUpdatedOffer ? "counter-offer" : "new-request";

  return {
    id: buildNotificationId(request, type, timestamp),
    type,
    source: "driver",
    title: isUpdatedOffer
      ? "Nueva contraoferta del pasajero"
      : "Nueva solicitud de viaje",
    description: isUpdatedOffer
      ? `${passengerName} envió una contraoferta de ${price} ${route}.`
      : `${passengerName} solicitó un lugar ${route} por ${price}.`,
    createdAt: eventDate,
    read: false,
    requestId: request.id,
    rideId: request.rideId,
  };
}

function createDriverCancellationNotification(
  request: RideRequest,
): NotificationEntry {
  const eventDate = resolveEventDate(request);
  const timestamp = eventDate.getTime();
  const passengerName = request.passengerName || "El pasajero";
  const route =
    request.origin && request.destination
      ? `del viaje de ${request.origin} a ${request.destination}`
      : "de tu viaje";

  return {
    id: buildNotificationId(request, "rejection", timestamp),
    type: "rejection",
    source: "driver",
    title: "El pasajero canceló la solicitud",
    description: `${passengerName} canceló la solicitud ${route}.`,
    createdAt: eventDate,
    read: false,
    requestId: request.id,
    rideId: request.rideId,
  };
}

function createPassengerCounterOfferNotification(
  request: RideRequest,
): NotificationEntry {
  const eventDate = resolveEventDate(request);
  const timestamp = eventDate.getTime();
  const driverName = request.driverName || "El conductor";
  const route =
    request.origin && request.destination
      ? `para el viaje de ${request.origin} a ${request.destination}`
      : "para tu viaje";
  const price = formatCurrency(
    request.counterOfferPrice ?? request.price ?? null,
  );

  return {
    id: buildNotificationId(request, "counter-offer", timestamp),
    type: "counter-offer",
    source: "passenger",
    title: "Nueva contraoferta",
    description: `${driverName} ofrece ${price} ${route}.`,
    createdAt: eventDate,
    read: false,
    requestId: request.id,
    rideId: request.rideId,
  };
}

function createPassengerRejectionNotification(
  request: RideRequest,
): NotificationEntry {
  const eventDate = resolveEventDate(request);
  const timestamp = eventDate.getTime();
  const driverName = request.driverName || "El conductor";
  const route =
    request.origin && request.destination
      ? `para el viaje de ${request.origin} a ${request.destination}`
      : "para tu viaje";

  return {
    id: buildNotificationId(request, "rejection", timestamp),
    type: "rejection",
    source: "passenger",
    title: "Tu solicitud fue rechazada",
    description: `${driverName} rechazó tu solicitud ${route}.`,
    createdAt: eventDate,
    read: false,
    requestId: request.id,
    rideId: request.rideId,
  };
}

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const notificationsRef = useRef<NotificationEntry[]>([]);
  const seenEventsRef = useRef<Set<string>>(new Set());
  const driverLastSeenRef = useRef<number>(Date.now());
  const passengerLastSeenRef = useRef<number>(Date.now());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      notificationsRef.current = [];
      setNotifications([]);
      seenEventsRef.current.clear();
      driverLastSeenRef.current = Date.now();
      passengerLastSeenRef.current = Date.now();
      setIsReady(false);
      return;
    }

    notificationsRef.current = [];
    setNotifications([]);
    seenEventsRef.current.clear();
    driverLastSeenRef.current = loadLastSeen(user.uid, "driver");
    passengerLastSeenRef.current = loadLastSeen(user.uid, "passenger");
    setIsReady(true);
  }, [user?.uid]);

  const pushNotifications = useCallback(
    (entries: NotificationEntry[]) => {
      if (!entries.length) return;
      const existingIds = new Set(
        notificationsRef.current.map((notification) => notification.id),
      );

      const deduped = entries.filter((entry) => {
        if (seenEventsRef.current.has(entry.id)) return false;
        if (existingIds.has(entry.id)) return false;
        seenEventsRef.current.add(entry.id);
        return true;
      });

      if (!deduped.length) return;

      const merged = [...deduped, ...notificationsRef.current]
        .sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )
        .slice(0, MAX_NOTIFICATIONS);

      notificationsRef.current = merged;
      setNotifications(merged);

      deduped.forEach((entry) => {
        const didPush = triggerBrowserNotification(entry);
        toast({
          title: entry.title,
          description: entry.description,
          variant: entry.type === "rejection" ? "destructive" : "default",
          duration: didPush ? 4000 : 5000,
        });
      });
    },
    [toast],
  );

  const processDriverRequests = useCallback(
    (requests: RideRequest[]) => {
      if (!user?.uid) return;

      const driverCutoff = driverLastSeenRef.current;
      const entries: NotificationEntry[] = [];

      requests.forEach((request) => {
        if (!request.id) return;
        const eventDate = resolveEventDate(request);
        const eventTimestamp = eventDate.getTime();

        if (eventTimestamp <= driverCutoff) return;

        if (request.status === "pending" && request.lastActionBy === "passenger") {
          entries.push(createDriverPendingNotification(request));
        }

        if (request.status === "rejected" && request.lastActionBy === "passenger") {
          entries.push(createDriverCancellationNotification(request));
        }
      });

      if (entries.length) {
        pushNotifications(entries);
      }
    },
    [pushNotifications, user?.uid],
  );

  const processPassengerRequests = useCallback(
    (requests: RideRequest[]) => {
      if (!user?.uid) return;

      const passengerCutoff = passengerLastSeenRef.current;
      const entries: NotificationEntry[] = [];

      requests.forEach((request) => {
        if (!request.id) return;
        const eventDate = resolveEventDate(request);
        const eventTimestamp = eventDate.getTime();

        if (eventTimestamp <= passengerCutoff) return;

        if (request.status === "countered" && request.lastActionBy === "driver") {
          entries.push(createPassengerCounterOfferNotification(request));
        }

        if (request.status === "rejected" && request.lastActionBy === "driver") {
          entries.push(createPassengerRejectionNotification(request));
        }
      });

      if (entries.length) {
        pushNotifications(entries);
      }
    },
    [pushNotifications, user?.uid],
  );

  useEffect(() => {
    if (!user?.uid || !isReady) return;

    const unsubscribeDriver = subscribeToDriverRequests(
      user.uid,
      processDriverRequests,
    );

    const unsubscribePassenger = subscribeToPassengerRequests(
      user.uid,
      processPassengerRequests,
    );

    return () => {
      unsubscribeDriver?.();
      unsubscribePassenger?.();
    };
  }, [user?.uid, isReady, processDriverRequests, processPassengerRequests]);

  const markAllAsRead = useCallback(() => {
    if (!user?.uid) return;
    if (!notificationsRef.current.length) return;

    let driverLatest = driverLastSeenRef.current;
    let passengerLatest = passengerLastSeenRef.current;

    const updated = notificationsRef.current.map((notification) => {
      if (!notification.read) {
        if (notification.source === "driver") {
          driverLatest = Math.max(
            driverLatest,
            notification.createdAt.getTime(),
          );
        }

        if (notification.source === "passenger") {
          passengerLatest = Math.max(
            passengerLatest,
            notification.createdAt.getTime(),
          );
        }

        return { ...notification, read: true };
      }

      return notification;
    });

    notificationsRef.current = updated;
    setNotifications(updated);

    if (driverLatest !== driverLastSeenRef.current) {
      driverLastSeenRef.current = driverLatest;
      persistLastSeen(user.uid, "driver", driverLatest);
    }

    if (passengerLatest !== passengerLastSeenRef.current) {
      passengerLastSeenRef.current = passengerLatest;
      persistLastSeen(user.uid, "passenger", passengerLatest);
    }
  }, [user?.uid]);

  const markAsRead = useCallback(
    (notificationId: string) => {
      if (!user?.uid) return;
      if (!notificationId) return;

      const existing = notificationsRef.current;
      if (!existing.length) return;

      const target = existing.find((notification) => notification.id === notificationId);
      if (!target) return;
      if (target.read) return;

      const updated = existing.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      );

      notificationsRef.current = updated;
      setNotifications(updated);

      const createdTimestamp = target.createdAt.getTime();

      if (target.source === "driver") {
        if (createdTimestamp > driverLastSeenRef.current) {
          driverLastSeenRef.current = createdTimestamp;
          persistLastSeen(user.uid, "driver", createdTimestamp);
        }
      }

      if (target.source === "passenger") {
        if (createdTimestamp > passengerLastSeenRef.current) {
          passengerLastSeenRef.current = createdTimestamp;
          persistLastSeen(user.uid, "passenger", createdTimestamp);
        }
      }
    },
    [user?.uid],
  );

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAllAsRead,
      markAsRead,
    }),
    [notifications, unreadCount, markAllAsRead, markAsRead],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications debe usarse dentro de un NotificationProvider",
    );
  }
  return context;
}
