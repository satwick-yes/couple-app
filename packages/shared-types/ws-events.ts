// packages/shared-types/ws-events.ts

export type ClientToServerEvents = {
  "join_room": (payload: { coupleId: string; userId: string }) => void;
  
  // Thumbkiss
  "touch_start": (payload: { x: number; y: number }) => void;
  "touch_move": (payload: { x: number; y: number }) => void;
  "touch_end": () => void;
  
  // Shared Canvas
  "canvas_draw": (payload: { x: number; y: number; color: string; isStart: boolean }) => void;
  "canvas_clear": () => void;
  
  // Virtual Pet Interactions
  "pet_feed": () => void;
  "pet_pet": () => void;
  
  // Typing state
  "typing_start": () => void;
  "typing_end": () => void;
};

export type ServerToClientEvents = {
  "partner_status": (payload: { isOnline: boolean; lastSeen?: Date }) => void;
  
  // Thumbkiss Broadcasts
  "partner_touch_start": (payload: { x: number; y: number }) => void;
  "partner_touch_move": (payload: { x: number; y: number }) => void;
  "partner_touch_end": () => void;
  "haptic_match": (payload: { intensity: 'light' | 'medium' | 'heavy' }) => void;
  
  // Canvas Broadcasts
  "partner_canvas_draw": (payload: { x: number; y: number; color: string; isStart: boolean }) => void;
  "partner_canvas_clear": () => void;

  // Pet State Sync
  "pet_state_update": (payload: { healthScore: number; lastFedAt: Date; actionTriggered: string }) => void;
  
  "partner_typing": (payload: { isTyping: boolean }) => void;
  "widget_updated": (payload: { imageUrl: string }) => void;
};
