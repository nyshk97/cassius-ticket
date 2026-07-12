export type UserRow = {
  id: number;
  email_address: string;
  password_digest: string;
};

export type EventRow = {
  id: number;
  title: string;
  player_name: string;
  event_date: string;
  venue: string | null;
  description: string | null;
  status: number; // 0=open, 1=closed
  token: string;
  created_at: string;
};

export type TicketTypeRow = {
  id: number;
  event_id: number;
  name: string;
  price: number;
  position: number;
};

export type OrderRow = {
  id: number;
  event_id: number;
  customer_name: string;
  phone_number: string | null;
  note: string | null;
  payment_status: number; // 0=unpaid, 1=paid
  delivery_status: number; // 0=undelivered, 1=delivered
  created_at: string;
};

export type OrderItemRow = {
  id: number;
  order_id: number;
  ticket_type_id: number;
  quantity: number;
};

export type Flash = { notice?: string; alert?: string };

export type AppEnv = {
  Bindings: Env;
  Variables: {
    currentUser?: UserRow;
    sessionId?: string;
    flash: Flash;
  };
};
