import { APIRequestContext } from '@playwright/test';
import { USERS, UserKey } from '../fixtures/users.data';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: 'to-do' | 'in-progress' | 'blocked' | 'completed';
  assigneeId?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ApiHelper {
  private request: APIRequestContext;
  private currentUser: UserKey = 'alice';

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  setUser(user: UserKey) {
    this.currentUser = user;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': USERS[this.currentUser].apiKey,
    };
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    const response = await this.request.post(`${BASE_URL}/api/tasks`, {
      headers: this.getHeaders(),
      data: {
        title: data.title,
        description: data.description || '',
        status: data.status || 'to-do',
        assigneeId: data.assigneeId || null,
      },
    });

    if (!response.ok()) {
      throw new Error(`Failed to create task: ${response.status()}`);
    }

    return response.json();
  }

  async updateTask(
    taskId: string,
    data: Partial<CreateTaskData>,
  ): Promise<Task> {
    // Status changes use a different endpoint
    if (data.status) {
      const response = await this.request.patch(
        `${BASE_URL}/api/tasks/${taskId}/status`,
        {
          headers: this.getHeaders(),
          data: { status: data.status },
        },
      );

      if (!response.ok()) {
        throw new Error(`Failed to update task status: ${response.status()}`);
      }

      return response.json();
    }

    // Other updates use the regular endpoint
    const response = await this.request.patch(`${BASE_URL}/api/tasks/${taskId}`, {
      headers: this.getHeaders(),
      data,
    });

    if (!response.ok()) {
      throw new Error(`Failed to update task: ${response.status()}`);
    }

    return response.json();
  }

  async deleteTask(taskId: string): Promise<void> {
    const response = await this.request.delete(
      `${BASE_URL}/api/tasks/${taskId}`,
      {
        headers: this.getHeaders(),
      },
    );

    if (!response.ok()) {
      throw new Error(`Failed to delete task: ${response.status()}`);
    }
  }

  async getTasks(): Promise<Task[]> {
    const response = await this.request.get(`${BASE_URL}/api/tasks`, {
      headers: this.getHeaders(),
    });

    if (!response.ok()) {
      throw new Error(`Failed to get tasks: ${response.status()}`);
    }

    return response.json();
  }
}
