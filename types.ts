
export type ItemStatus = 'Pending' | 'Done';

export interface ActionItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string; // ISO format: YYYY-MM-DD
  status: ItemStatus;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  expectedBehavior: string;
  type: 'positive' | 'negative';
  status: 'idle' | 'running' | 'passed' | 'failed';
}
