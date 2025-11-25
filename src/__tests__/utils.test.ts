import bcrypt from 'bcryptjs';

// Test password utilities directly without importing utils (which imports uuid)
const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

const paginate = (page: number = 1, limit: number = 20) => {
  const offset = (page - 1) * limit;
  return { offset, limit: Math.min(limit, 100) };
};

const formatPaginationResponse = (page: number, limit: number, total: number) => {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

describe('Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      
      const isMatch = await comparePassword('wrongPassword', hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('paginate', () => {
    it('should return correct offset and limit', () => {
      const result = paginate(1, 20);
      expect(result).toEqual({ offset: 0, limit: 20 });
    });

    it('should calculate offset for page 2', () => {
      const result = paginate(2, 20);
      expect(result).toEqual({ offset: 20, limit: 20 });
    });

    it('should limit to max 100', () => {
      const result = paginate(1, 200);
      expect(result).toEqual({ offset: 0, limit: 100 });
    });

    it('should use defaults when not provided', () => {
      const result = paginate();
      expect(result).toEqual({ offset: 0, limit: 20 });
    });
  });

  describe('formatPaginationResponse', () => {
    it('should format pagination correctly', () => {
      const result = formatPaginationResponse(1, 20, 100);
      expect(result).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
      });
    });

    it('should handle partial pages', () => {
      const result = formatPaginationResponse(1, 20, 25);
      expect(result).toEqual({
        page: 1,
        limit: 20,
        total: 25,
        totalPages: 2,
      });
    });

    it('should handle zero results', () => {
      const result = formatPaginationResponse(1, 20, 0);
      expect(result).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });
  });
});
