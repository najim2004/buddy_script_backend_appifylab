import userRepository from './user.repository';
import type { User } from '../../../prisma/generated/client';
import type { UpdateUserDto } from './user.schema';
import type { PaginatedUsers } from './user.repository';

export class UserService {
  async getUser(id: string): Promise<User | null> {
    return userRepository.findById(id);
  }

  async getAllUsers(params: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedUsers> {
    return userRepository.findAll(params);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    return userRepository.update(id, data);
  }
}

export const userService = new UserService();
export default userService;
