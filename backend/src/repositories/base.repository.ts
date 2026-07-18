export interface IPagination {
  skip?: number;
  take?: number;
}

export interface IPaginatedResult<T> {
  data: T[];
  total: number;
}

export class BaseRepository<T, CreateDTO, UpdateDTO> {
  protected delegate: any;

  constructor(delegate: any) {
    this.delegate = delegate;
  }

  async findById(id: string): Promise<T | null> {
    return this.delegate.findUnique({
      where: { id },
    });
  }

  async findMany(
    filter: object = {},
    skip: number = 0,
    take: number = 20
  ): Promise<IPaginatedResult<T>> {
    const [data, total] = await Promise.all([
      this.delegate.findMany({
        where: filter,
        skip,
        take,
      }),
      this.delegate.count({
        where: filter,
      }),
    ]);

    return { data, total };
  }

  async findUnique(filter: object): Promise<T | null> {
    return this.delegate.findUnique({
      where: filter,
    });
  }

  async create(data: CreateDTO): Promise<T> {
    return this.delegate.create({
      data,
    });
  }

  async update(id: string, data: UpdateDTO): Promise<T> {
    return this.delegate.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    return this.delegate.delete({
      where: { id },
    });
  }
}
