import { eq, like, and, desc, count } from 'drizzle-orm';
import { db, pets } from '../config/database';
import { PetQueryParams, Pet, NewPet } from '../types/api';
import { generateId } from '../utils/id';

export class PetService {
  async getAllPets(params: PetQueryParams): Promise<{ pets: Pet[]; total: number }> {
    const { page = 1, limit = 10, type, breed, gender } = params;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (type) {
      conditions.push(eq(pets.type, type));
    }

    if (breed) {
      conditions.push(like(pets.breed, `%${breed}%`));
    }

    if (gender) {
      conditions.push(eq(pets.gender, gender));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

  async getPetById(id: string): Promise<Pet | null> {
    const [pet] = await db.select().from(pets).where(eq(pets.id, id));
    return pet || null;
  }

  async createPet(petData: Omit<NewPet, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pet> {
    const newPet: NewPet = {
      id: generateId(),
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

  async updatePet(id: string, updates: Partial<NewPet>): Promise<Pet | null> {
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    const [updatedPet] = await db
      .update(pets)
      .set(updateData)
      .where(eq(pets.id, id))
      .returning();

    return updatedPet || null;
  }

  async deletePet(id: string): Promise<boolean> {
    const [deletedPet] = await db
      .delete(pets)
      .where(eq(pets.id, id))
      .returning();

    return !!deletedPet;
  }

  async updatePetPhoto(id: string, photoUrl: string): Promise<Pet | null> {
    const [updatedPet] = await db
      .update(pets)
      .set({
        profilePhoto: photoUrl,
        updatedAt: new Date()
      })
      .where(eq(pets.id, id))
      .returning();

    return updatedPet || null;
  }
}