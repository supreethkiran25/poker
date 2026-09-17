import { z } from 'zod';
import type { ActionType, RoomConfig } from './types.js';

export const RoomConfigSchema = z.object({
  maxPlayers: z.number().int().min(2).max(10).default(8),
  startingChips: z.number().int().min(0).max(100000000).default(10000),
  smallBlind: z.number().int().min(1).max(500000).default(50),
  bigBlind: z.number().int().min(2).max(1000000).default(100),
  turnTimerSeconds: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]).default(30),
  allowSpectators: z.boolean().default(true),
  chatEnabled: z.boolean().default(true),
  reactionsEnabled: z.boolean().default(true),
  voiceEnabled: z.boolean().default(true),
});

export const CreateRoomSchema = z.object({
  hostName: z.string().trim().min(1).max(25),
  avatar: z.string().default('avatar-1'),
  config: RoomConfigSchema.optional(),
  buyIn: z.number().int().min(0).optional(),
});

export const JoinRoomSchema = z.object({
  roomCode: z.string().trim().min(3).max(10).toUpperCase(),
  playerName: z.string().trim().min(1).max(25),
  avatar: z.string().default('avatar-1'),
  sessionToken: z.string().optional(),
  playerId: z.string().optional(),
  buyIn: z.number().int().min(0).optional(),
});

export const LeaveRoomSchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
});

export const PlayerReadySchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
  ready: z.boolean(),
});

export const StartGameSchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
});

export const GameActionSchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
  actionId: z.string().min(1),
  type: z.enum(['fold', 'check', 'call', 'bet', 'raise', 'all-in'] as const),
  amount: z.number().int().min(0).optional(),
});

export const ChatMessageSchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
  message: z.string().trim().min(1).max(200),
});

export const ReactionSchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
  reaction: z.enum(['😂', '🔥', '😮', '👏', 'GG', '💀', '💸']),
});

export const UpdateConfigSchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
  config: RoomConfigSchema,
});

export const KickPlayerSchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
  targetPlayerId: z.string().min(1),
});

export const RematchSchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
});

export const AddBotSchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
  personality: z.enum(['shark', 'aggressive', 'passive', 'balanced']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  name: z.string().optional(),
});

export const RemoveBotSchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
  botPlayerId: z.string().min(1),
});

export const FillBotsSchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
  targetCount: z.number().int().min(2).max(10).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).optional(),
});

export const ClearBotsSchema = z.object({
  roomCode: z.string().trim().toUpperCase(),
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;
export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;
export type GameActionInput = z.infer<typeof GameActionSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type ReactionInput = z.infer<typeof ReactionSchema>;
export type UpdateConfigInput = z.infer<typeof UpdateConfigSchema>;
export type AddBotInput = z.infer<typeof AddBotSchema>;
export type RemoveBotInput = z.infer<typeof RemoveBotSchema>;
export type FillBotsInput = z.infer<typeof FillBotsSchema>;
export type ClearBotsInput = z.infer<typeof ClearBotsSchema>;
