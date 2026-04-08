export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface Room {
  id: string;
  room_name: string;
  owner_id: string;
  max_members: number;
  created_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

export interface Expense {
  id: string;
  room_id: string;
  user_id: string;
  product_name: string;
  price: number;
  created_at: string;
}

export interface RoomWithMembers extends Room {
  members: (RoomMember & { email?: string; username?: string })[];
}

export interface ExpenseWithUser extends Expense {
  email?: string;
  username?: string;
}
