import { prisma } from '../../infrastructure/prisma/client';
import type { User } from '../../../prisma/generated/client';
import type { UpdateUserDto } from './user.schema';
import {
  buildPaginationMeta,
  getSkip,
  parsePagination,
} from '../../core/utils/pagination';
import type { PaginationMeta } from '../../core/utils/response';

export interface PaginatedUsers {
  data: User[];
  meta: PaginationMeta;
}

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedUsers> {
    const { page, limit } = parsePagination(params);
    const skip = getSkip(page, limit);

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
