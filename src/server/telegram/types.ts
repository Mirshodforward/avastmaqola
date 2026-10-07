// Telegram Bot API’ning bizga kerakli qismi: https://core.telegram.org/bots/api

export type TgUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

export type TgChat = { id: number; type: "private" | "group" | "supergroup" | "channel" };

export type TgContact = {
  phone_number: string;
  first_name: string;
  last_name?: string;
  /** Kontakt egasining Telegram id’si — o‘z kontaktini yuborganda message.from.id bilan teng */
  user_id?: number;
};

export type TgMessage = {
  message_id: number;
  date: number;
  chat: TgChat;
  from?: TgUser;
  text?: string;
  contact?: TgContact;
};

export type TgUpdate = { update_id: number; message?: TgMessage };

export type ReplyMarkup =
  | {
      keyboard: { text: string; request_contact?: boolean }[][];
      resize_keyboard?: boolean;
      one_time_keyboard?: boolean;
      input_field_placeholder?: string;
    }
  | { remove_keyboard: true };
