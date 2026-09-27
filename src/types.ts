export type Folder = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  deletedAt?: string;
};

export type Memo = {
  id: string;
  folderId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};
