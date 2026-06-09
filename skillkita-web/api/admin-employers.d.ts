import type { IncomingMessage, ServerResponse } from "http";

declare function handler(req: IncomingMessage, res: ServerResponse): Promise<void>;

export default handler;

export const config: {
  api: {
    bodyParser: boolean;
  };
};
