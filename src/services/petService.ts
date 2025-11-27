import { eq, like, and, desc, count } from 'drizzle-orm';
import { db, pets } from '../config/database';
import { PetQueryParams, Pet, NewPet } from '../types/api';
import { generateId } from '../utils/id';

export class PetService {
  /**
   * Get all pets for a specific user
   */
  async getAllPets(userId: string, params: PetQueryParams): Promise<{ pets: Pet[]; total: number }> {
    const { page = 1, limit = 10, type, breed, gender } = params;
    const offset = (page - 1) * limit;

    // Build where conditions - always filter by userId
    const conditions = [eq(pets.userId, userId)];

    if (type) {
      conditions.push(eq(pets.type, type));
    }

    if (breed) {
      conditions.push(like(pets.breed, `%${breed}%`));
    }

    if (gender) {
      conditions.push(eq(pets.gender, gender));
    }

    const whereClause = and(...conditions);

    // Get total count
    const result = await db
      .select({ total: count() })
      .from(pets)
      .where(whereClause);

    const total = result[0]?.total || 0;

    // Get pets with pagination
    const petsList = await db
      .select()
      .from(pets)
      .where(whereClause)
      .orderBy(desc(pets.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      pets: petsList,
      total,
    };
  }

  /**
   * Get a pet by ID, ensuring it belongs to the user
   */
  async getPetById(userId: string, id: string): Promise<Pet | null> {
    const [pet] = await db
      .select()
      .from(pets)
      .where(and(eq(pets.id, id), eq(pets.userId, userId)));
    return pet || null;
  }

  /**
   * Create a new pet for a user
   */
  async createPet(userId: string, petData: Omit<NewPet, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Pet> {
    const newPet: NewPet = {
      id: generateId(),
      userId,
      ...petData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(pets).values(newPet).returning();
    const createdPet = result[0];
    if (!createdPet) {
      throw new Error('Failed to create pet');
    }
    return createdPet;
  }

  /**
   * Update a pet, ensuring it belongs to the user
   */
  async updatePet(userId: string, id: string, updates: Partial<NewPet>): Promise<Pet | null> {
    // Don't allow updating userId
    const { userId: _, ...safeUpdates } = updates as any;

    const updateData = {
      ...safeUpdates,
      updatedAt: new Date(),
    };

    const [updatedPet] = await db
      .update(pets)
      .set(updateData)
      .where(and(eq(pets.id, id), eq(pets.userId, userId)))
      .returning();

    return updatedPet || null;
  }

  /**
   * Delete a pet, ensuring it belongs to the user
   */
  async deletePet(userId: string, id: string): Promise<boolean> {
    const [deletedPet] = await db
      .delete(pets)
      .where(and(eq(pets.id, id), eq(pets.userId, userId)))
      .returning();

    return !!deletedPet;
  }

  /**
   * Update pet photo, ensuring it belongs to the user
   */
  async updatePetPhoto(userId: string, id: string, photoUrl: string): Promise<Pet | null> {
    const [updatedPet] = await db
      .update(pets)
      .set({
        profilePhoto: photoUrl,
        updatedAt: new Date()
      })
      .where(and(eq(pets.id, id), eq(pets.userId, userId)))
      .returning();

    return updatedPet || null;
  }
}
