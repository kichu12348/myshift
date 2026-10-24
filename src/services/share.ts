import { Share } from 'react-native';

export interface ShareOptions {
  readonly title?: string;
  readonly message: string;
}

export interface ShareService {
  shareText(options: ShareOptions): Promise<boolean>;
}

export const shareService: ShareService = {
  async shareText(options: ShareOptions): Promise<boolean> {
    try {
      const result = await Share.share({
        title: options.title,
        message: options.message,
      });
      return result.action === Share.sharedAction;
    } catch {
      return false;
    }
  },
};
