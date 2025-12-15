import { PetModel } from '../models/mongoose/pet';
import { NewPet, Pet, PetQueryParams } from '../types/api';

export class PetService {
  /**
   * Get all pets for a specific user
   */
  async getAllPets(
    userId: string,
    params: PetQueryParams
  ): Promise<{ pets: Pet[]; total: number }> {
    const { page = 1, limit = 10, type, breed, gender } = params;
    const offset = (page - 1) * limit;

    // Build where conditions - always filter by userId
    const whereClause: any = { userId };

    if (type) {
      whereClause.type = type;
    }

    if (breed) {
      whereClause.breed = { $regex: breed, $options: 'i' };
    }

    if (gender) {
      whereClause.gender = gender;
    }

    // Get total count
    const total = await PetModel.countDocuments(whereClause);

    // Get pets with pagination
    const petsList = await PetModel.find(whereClause)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .exec();

    return {
      pets: petsList,
      total,
    };
  }

  /**
   * Get a pet by ID, ensuring it belongs to the user
   */
  async getPetById(userId: string, id: string): Promise<Pet | null> {
    const pet = await PetModel.findOne({ _id: id, userId }).exec();
    return pet ?? null;
  }

  /**
   * Create a new pet for a user
   */
  async createPet(
    userId: string,
    petData: Omit<NewPet, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<Pet> {
    const newPet = new PetModel({ ...petData, userId });
    const createdPet = await newPet.save();

    if (!createdPet) {
      throw new Error('Failed to create pet');
    }
    return createdPet;
  }

  /**
   * Update a pet, ensuring it belongs to the user
   */
  async updatePet(
    userId: string,
    id: string,
    updates: Partial<NewPet>
  ): Promise<Pet | null> {
    // Don't allow updating userId
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: _userId, ...safeUpdates } = updates;

    const updatedPet = await PetModel.findOneAndUpdate(
      { _id: id, userId },
      safeUpdates,
      { new: true }
    ).exec();

    return updatedPet ?? null;
  }

  /**
   * Delete a pet, ensuring it belongs to the user
   */
  async deletePet(userId: string, id: string): Promise<boolean> {
    const deletedPet = await PetModel.findOneAndDelete({ _id: id, userId }).exec();
    return !!deletedPet;
  }

  /**
   * Update pet photo, ensuring it belongs to the user
   */
  async updatePetPhoto(
    userId: string,
    id: string,
    photoUrl: string
  ): Promise<Pet | null> {
    const updatedPet = await PetModel.findOneAndUpdate(
      { _id: id, userId },
      { profilePhoto: photoUrl },
      { new: true }
    ).exec();

    return updatedPet ?? null;
  }
}
