export interface ICommit {
  hash: string;
  short: string;
  date: Date;
  msg: string;
  author: {
    name: string;
    email: string;
  };
}
