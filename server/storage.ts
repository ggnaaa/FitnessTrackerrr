import {
  users, User, InsertUser,
  healthMetrics, HealthMetric, InsertHealthMetric,
  dietPlans, DietPlan, InsertDietPlan,
  meals, Meal, InsertMeal,
  workouts, Workout, InsertWorkout,
  exercises, Exercise, InsertExercise,
  articles, Article, InsertArticle,
  goals, Goal, InsertGoal
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Health Metrics methods
  getHealthMetrics(userId: number): Promise<HealthMetric[]>;
  getLatestHealthMetric(userId: number): Promise<HealthMetric | undefined>;
  createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric>;
  
  // Diet Plan methods
  getDietPlans(userId: number): Promise<DietPlan[]>;
  getCurrentDietPlan(userId: number): Promise<DietPlan | undefined>;
  createDietPlan(plan: InsertDietPlan): Promise<DietPlan>;
  
  // Meal methods
  getMeals(dietPlanId: number): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  
  // Workout methods
  getWorkouts(userId: number): Promise<Workout[]>;
  getCurrentWorkout(userId: number): Promise<Workout | undefined>;
  getUpcomingWorkouts(userId: number, limit?: number): Promise<Workout[]>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  
  // Exercise methods
  getExercises(workoutId: number): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  
  // Article methods
  getArticles(limit?: number, category?: string): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  
  // Goal methods
  getGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoalProgress(id: number, currentValue: number): Promise<Goal>;
  markGoalComplete(id: number): Promise<Goal>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private healthMetrics: Map<number, HealthMetric>;
  private dietPlans: Map<number, DietPlan>;
  private meals: Map<number, Meal>;
  private workouts: Map<number, Workout>;
  private exercises: Map<number, Exercise>;
  private articles: Map<number, Article>;
  private goals: Map<number, Goal>;
  
  // ID counters
  private userId = 1;
  private healthMetricId = 1;
  private dietPlanId = 1;
  private mealId = 1;
  private workoutId = 1;
  private exerciseId = 1;
  private articleId = 1;
  private goalId = 1;

  constructor() {
    this.users = new Map();
    this.healthMetrics = new Map();
    this.dietPlans = new Map();
    this.meals = new Map();
    this.workouts = new Map();
    this.exercises = new Map();
    this.articles = new Map();
    this.goals = new Map();
    
    // Add some sample articles
    this.seedArticles();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      return {
        ...user,
        createdAt: typeof user.createdAt === "string" ? new Date(user.createdAt) : user.createdAt,
        avatar: user.avatar ?? null,
      };
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { 
      ...user, 
      id,
      createdAt: new Date().toISOString(),
      avatar: user.avatar ?? null,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  // Health Metrics methods
  async getHealthMetrics(userId: number): Promise<HealthMetric[]> {
    const metrics = Array.from(this.healthMetrics.values())
      .filter(metric => metric.userId === userId)
      .sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime());
    return metrics.map(m => ({
      ...m,
      recordedDate: typeof m.recordedDate === "string" ? m.recordedDate : (m.recordedDate as Date).toISOString(),
      createdAt: typeof m.createdAt === "string" ? new Date(m.createdAt) : m.createdAt,
    }));
  }

  async getLatestHealthMetric(userId: number): Promise<HealthMetric | undefined> {
    const metrics = await this.getHealthMetrics(userId);
    if (metrics.length > 0) {
      const m = metrics[0];
      return {
        ...m,
        recordedDate: typeof m.recordedDate === "string" ? new Date(m.recordedDate) : m.recordedDate,
        createdAt: typeof m.createdAt === "string" ? new Date(m.createdAt) : m.createdAt,
      };
    }
    return undefined;
  }

  async createHealthMetric(metric: InsertHealthMetric): Promise<HealthMetric> {
    const id = this.healthMetricId++;
    // Calculate BMI: weight (kg) / (height (m) * height (m))
    const heightInMeters = metric.height / 100;
    const bmi = +(metric.weight / (heightInMeters * heightInMeters)).toFixed(1);
    
    const newMetric: HealthMetric = {
      ...metric,
      id,
      bmi,
      createdAt: new Date(),
      recordedDate: metric.recordedDate || new Date(),
    };
    
    this.healthMetrics.set(id, newMetric);
    return newMetric;
  }

  // Diet Plan methods
  async getDietPlans(userId: number): Promise<DietPlan[]> {
    const plans = Array.from(this.dietPlans.values())
      .filter(plan => plan.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return plans.map(p => ({
      ...p,
      createdAt: typeof p.createdAt === "string" ? new Date(p.createdAt) : p.createdAt,
    }));
  }

  async getCurrentDietPlan(userId: number): Promise<DietPlan | undefined> {
    const plans = await this.getDietPlans(userId);
    if (plans.length > 0) {
      const p = plans[0];
      return {
        ...p,
        createdAt: typeof p.createdAt === "string" ? new Date(p.createdAt) : p.createdAt,
      };
    }
    return undefined;
  }

  async createDietPlan(plan: InsertDietPlan): Promise<DietPlan> {
    const id = this.dietPlanId++;
    const newPlan: DietPlan = {
      ...plan,
      id,
      createdAt: new Date().toISOString(),
    };
    this.dietPlans.set(id, newPlan);
    return newPlan;
  }

  // Meal methods
  async getMeals(dietPlanId: number): Promise<Meal[]> {
    return Array.from(this.meals.values())
      .filter(meal => meal.dietPlanId === dietPlanId);
  }

  async createMeal(meal: InsertMeal): Promise<Meal> {
    const id = this.mealId++;
    const newMeal: Meal = {
      ...meal,
      id,
      createdAt: new Date().toISOString(),
    };
    this.meals.set(id, newMeal);
    return newMeal;
  }

  // Workout methods
  async getWorkouts(userId: number): Promise<Workout[]> {
    const workouts = Array.from(this.workouts.values())
      .filter(workout => workout.userId === userId)
      .sort((a, b) => {
        if (a.scheduledDate && b.scheduledDate) {
          return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    return workouts.map(w => ({
      ...w,
      createdAt: typeof w.createdAt === "string" ? new Date(w.createdAt) : w.createdAt,
    }));
  }

  async getCurrentWorkout(userId: number): Promise<Workout | undefined> {
    const today = new Date().toISOString().split('T')[0];
    
    const workouts = await this.getWorkouts(userId);
    if (workouts.length > 0) {
      const w = workouts.find(w => w.scheduledDate === today) || workouts[0];
      return {
        ...w,
        createdAt: typeof w.createdAt === "string" ? new Date(w.createdAt) : w.createdAt,
      };
    }
    return undefined;
  }

  async getUpcomingWorkouts(userId: number, limit: number = 5): Promise<Workout[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const workouts = Array.from(this.workouts.values())
      .filter(workout => 
        workout.userId === userId && 
        workout.scheduledDate && 
        workout.scheduledDate > today
      )
      .sort((a, b) => {
        if (a.scheduledDate && b.scheduledDate) {
          return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
        }
        return 0;
      })
      .slice(0, limit);
    return workouts.map(w => ({
      ...w,
      createdAt: typeof w.createdAt === "string" ? new Date(w.createdAt) : w.createdAt,
    }));
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const id = this.workoutId++;
    const newWorkout: Workout = {
      ...workout,
      id,
      createdAt: new Date().toISOString(),
    };
    this.workouts.set(id, newWorkout);
    return newWorkout;
  }

  // Exercise methods
  async getExercises(workoutId: number): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.workoutId === workoutId);
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const id = this.exerciseId++;
    const newExercise: Exercise = {
      ...exercise,
      id,
      createdAt: new Date().toISOString(),
    };
    this.exercises.set(id, newExercise);
    return newExercise;
  }

  // Article methods
  async getArticles(limit: number = 10, category?: string): Promise<Article[]> {
    let articles = Array.from(this.articles.values());
    
    if (category) {
      articles = articles.filter(article => article.category === category);
    }
    
    return articles
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const article = this.articles.get(id);
    if (article) {
      return {
        ...article,
        createdAt: typeof article.createdAt === "string" ? new Date(article.createdAt) : article.createdAt,
        imageUrl: article.imageUrl ?? null,
      };
    }
    return article;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const id = this.articleId++;
    const newArticle: Article = {
      ...article,
      id,
      createdAt: new Date().toISOString(),
    };
    this.articles.set(id, newArticle);
    return newArticle;
  }

  // Goal methods
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .filter(goal => goal.userId === userId)
      .sort((a, b) => new Date(a.targetDate || "").getTime() - new Date(b.targetDate || "").getTime());
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.goalId++;
    const newGoal: Goal = {
      ...goal,
      id,
      createdAt: new Date().toISOString(),
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async updateGoalProgress(id: number, currentValue: number): Promise<Goal> {
    const goal = this.goals.get(id);
    if (!goal) {
      throw new Error(`Goal with ID ${id} not found`);
    }
    
    const updatedGoal: Goal = {
      ...goal,
      currentValue,
    };
    
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async markGoalComplete(id: number): Promise<Goal> {
    const goal = this.goals.get(id);
    if (!goal) {
      throw new Error(`Goal with ID ${id} not found`);
    }
    
    const updatedGoal: Goal = {
      ...goal,
      completed: true,
    };
    
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  // Seed with sample articles for demonstration
  private seedArticles() {
    const sampleArticles: InsertArticle[] = [
      {
        title: "10 Superfoods to Boost Your Immune System",
        content: "Long detailed content about superfoods and their benefits...",
        summary: "Discover foods that can help strengthen your body's natural defenses.",
        imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352",
        category: "Nutrition",
        readTime: 5
      },
      {
        title: "The Benefits of Strength Training for Women",
        content: "Detailed content about benefits of strength training for women...",
        summary: "Why building muscle is crucial for women's health and fitness goals.",
        imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438",
        category: "Exercise",
        readTime: 7
      },
      {
        title: "5 Easy Meal Prep Ideas for Busy Professionals",
        content: "Content about meal preparation strategies...",
        summary: "Time-saving meal prep strategies that don't sacrifice nutrition.",
        imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd",
        category: "Meal Prep",
        readTime: 4
      },
      {
        title: "How to Create a Sustainable Fitness Routine",
        content: "Content about creating sustainable fitness habits...",
        summary: "Tips for building exercise habits that last a lifetime.",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b",
        category: "Fitness",
        readTime: 6
      },
      {
        title: "Understanding Macronutrients: A Guide for Beginners",
        content: "Detailed guide about protein, carbs and fats...",
        summary: "Learn the basics of proteins, carbs, and fats for better nutrition.",
        imageUrl: "https://images.unsplash.com/photo-1505253758473-96b7015fcd40",
        category: "Nutrition",
        readTime: 8
      }
    ];
    
    // Seed articles
    sampleArticles.forEach(article => {
      const id = this.articleId++;
      this.articles.set(id, {
        ...article,
        id,
        createdAt: new Date()
      });
    });
  }
}

export const storage = new MemStorage();
