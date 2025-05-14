import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertHealthMetricsSchema, 
  insertDietPlanSchema, 
  insertMealSchema, 
  insertWorkoutSchema, 
  insertExerciseSchema, 
  insertGoalSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();
  
  // Error handling middleware for Zod validation
  const validateRequest = (schema: any) => {
    return (req: Request, res: Response, next: Function) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          res.status(400).json({ 
            message: "Validation failed", 
            errors: validationError.details 
          });
        } else {
          next(error);
        }
      }
    };
  };

  // User routes
  router.post("/users", validateRequest(insertUserSchema), async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }
      
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user", error });
    }
  });

  router.get("/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user", error });
    }
  });

  // Health Metrics routes
  router.post("/health-metrics", validateRequest(insertHealthMetricsSchema), async (req, res) => {
    try {
      const metric = await storage.createHealthMetric(req.body);
      res.status(201).json(metric);
    } catch (error) {
      res.status(500).json({ message: "Failed to create health metric", error });
    }
  });

  router.get("/users/:userId/health-metrics", async (req, res) => {
    try {
      const metrics = await storage.getHealthMetrics(parseInt(req.params.userId));
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch health metrics", error });
    }
  });

  router.get("/users/:userId/health-metrics/latest", async (req, res) => {
    try {
      const metric = await storage.getLatestHealthMetric(parseInt(req.params.userId));
      if (!metric) {
        return res.status(404).json({ message: "No health metrics found for user" });
      }
      res.json(metric);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch latest health metric", error });
    }
  });

  // Diet Plan routes
  router.post("/diet-plans", validateRequest(insertDietPlanSchema), async (req, res) => {
    try {
      const plan = await storage.createDietPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to create diet plan", error });
    }
  });

  router.get("/users/:userId/diet-plans", async (req, res) => {
    try {
      const plans = await storage.getDietPlans(parseInt(req.params.userId));
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch diet plans", error });
    }
  });

  router.get("/users/:userId/diet-plans/current", async (req, res) => {
    try {
      const plan = await storage.getCurrentDietPlan(parseInt(req.params.userId));
      if (!plan) {
        return res.status(404).json({ message: "No current diet plan found for user" });
      }
      
      // Get the meals for this plan
      const meals = await storage.getMeals(plan.id);
      
      res.json({ ...plan, meals });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current diet plan", error });
    }
  });

  // Meal routes
  router.post("/meals", validateRequest(insertMealSchema), async (req, res) => {
    try {
      const meal = await storage.createMeal(req.body);
      res.status(201).json(meal);
    } catch (error) {
      res.status(500).json({ message: "Failed to create meal", error });
    }
  });

  router.get("/diet-plans/:dietPlanId/meals", async (req, res) => {
    try {
      const meals = await storage.getMeals(parseInt(req.params.dietPlanId));
      res.json(meals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch meals", error });
    }
  });

  // Workout routes
  router.post("/workouts", validateRequest(insertWorkoutSchema), async (req, res) => {
    try {
      const workout = await storage.createWorkout(req.body);
      res.status(201).json(workout);
    } catch (error) {
      res.status(500).json({ message: "Failed to create workout", error });
    }
  });

  router.get("/users/:userId/workouts", async (req, res) => {
    try {
      const workouts = await storage.getWorkouts(parseInt(req.params.userId));
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workouts", error });
    }
  });

  router.get("/users/:userId/workouts/current", async (req, res) => {
    try {
      const workout = await storage.getCurrentWorkout(parseInt(req.params.userId));
      if (!workout) {
        return res.status(404).json({ message: "No current workout found for user" });
      }
      
      // Get exercises for this workout
      const exercises = await storage.getExercises(workout.id);
      
      res.json({ ...workout, exercises });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current workout", error });
    }
  });

  router.get("/users/:userId/workouts/upcoming", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const workouts = await storage.getUpcomingWorkouts(parseInt(req.params.userId), limit);
      
      // Get exercises for each workout
      const workoutsWithExercises = await Promise.all(
        workouts.map(async (workout) => {
          const exercises = await storage.getExercises(workout.id);
          return { ...workout, exercises };
        })
      );
      
      res.json(workoutsWithExercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming workouts", error });
    }
  });

  // Exercise routes
  router.post("/exercises", validateRequest(insertExerciseSchema), async (req, res) => {
    try {
      const exercise = await storage.createExercise(req.body);
      res.status(201).json(exercise);
    } catch (error) {
      res.status(500).json({ message: "Failed to create exercise", error });
    }
  });

  router.get("/workouts/:workoutId/exercises", async (req, res) => {
    try {
      const exercises = await storage.getExercises(parseInt(req.params.workoutId));
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercises", error });
    }
  });

  // Articles routes
  router.get("/articles", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const category = req.query.category as string | undefined;
      
      const articles = await storage.getArticles(limit, category);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles", error });
    }
  });

  router.get("/articles/:id", async (req, res) => {
    try {
      const article = await storage.getArticle(parseInt(req.params.id));
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article", error });
    }
  });

  // Goal routes
  router.post("/goals", validateRequest(insertGoalSchema), async (req, res) => {
    try {
      const goal = await storage.createGoal(req.body);
      res.status(201).json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to create goal", error });
    }
  });

  router.get("/users/:userId/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals(parseInt(req.params.userId));
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals", error });
    }
  });

  router.patch("/goals/:id/progress", async (req, res) => {
    try {
      if (typeof req.body.currentValue !== 'number') {
        return res.status(400).json({ message: "currentValue must be a number" });
      }
      
      const goal = await storage.updateGoalProgress(
        parseInt(req.params.id), 
        req.body.currentValue
      );
      
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to update goal progress", error });
    }
  });

  router.patch("/goals/:id/complete", async (req, res) => {
    try {
      const goal = await storage.markGoalComplete(parseInt(req.params.id));
      res.json(goal);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark goal as complete", error });
    }
  });
  
  // Health recommendations endpoint - generates diet and workout based on health metrics
  router.get("/users/:userId/recommendations", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const latestMetric = await storage.getLatestHealthMetric(userId);
      
      if (!latestMetric) {
        return res.status(404).json({ message: "No health metrics found for user" });
      }
      
      // Generate recommendations based on the user's health metrics
      const recommendations = generateRecommendations(latestMetric);
      
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate recommendations", error });
    }
  });
  
  // Demo user setup route - creates a demo user with sample data
  router.post("/setup-demo", async (req, res) => {
    try {
      // Create a demo user
      const user = await storage.createUser({
        username: "demo_user",
        password: "password123",
        name: "User",
        email: "user@example.com",
        avatar: null
      });
      
      // Create health metrics
      const healthMetric = await storage.createHealthMetric({
        userId: user.id,
        weight: 68,
        height: 173,
        recordedDate: new Date(),
        calories: 1850,
        activeMinutes: 38
      });
      
      // Create a diet plan
      const dietPlan = await storage.createDietPlan({
        userId: user.id,
        name: "Weight Maintenance Plan",
        description: "Balanced nutrition for maintaining healthy weight",
        totalCalories: 1850
      });
      
      // Add meals to the diet plan
      await storage.createMeal({
        dietPlanId: dietPlan.id,
        name: "Breakfast",
        description: "Greek yogurt with berries and granola",
        calories: 380,
        mealTime: "8:00 AM",
        icon: "breakfast_dining"
      });
      
      await storage.createMeal({
        dietPlanId: dietPlan.id,
        name: "Lunch",
        description: "Grilled chicken salad with olive oil dressing",
        calories: 450,
        mealTime: "12:30 PM",
        icon: "lunch_dining"
      });
      
      await storage.createMeal({
        dietPlanId: dietPlan.id,
        name: "Dinner",
        description: "Baked salmon with quinoa and steamed vegetables",
        calories: 520,
        mealTime: "7:00 PM",
        icon: "dinner_dining"
      });
      
      // Create today's workout
      const today = new Date().toISOString().split('T')[0];
      const workout = await storage.createWorkout({
        userId: user.id,
        name: "Full Body Strength",
        description: "Complete body workout focusing on all major muscle groups",
        duration: 30,
        icon: "fitness_center",
        scheduledDate: today,
        scheduledTime: "5:00 PM"
      });
      
      // Add exercises to the workout
      await storage.createExercise({
        workoutId: workout.id,
        name: "Squats",
        sets: 3,
        reps: 12,
        icon: "fitness_center"
      });
      
      await storage.createExercise({
        workoutId: workout.id,
        name: "Push-ups",
        sets: 3,
        reps: 10,
        icon: "fitness_center"
      });
      
      await storage.createExercise({
        workoutId: workout.id,
        name: "Lunges",
        sets: 3,
        reps: 10,
        icon: "fitness_center"
      });
      
      // Create upcoming workouts
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const hiitWorkout = await storage.createWorkout({
        userId: user.id,
        name: "HIIT Cardio",
        description: "High intensity interval training for maximum calorie burn",
        duration: 20,
        icon: "directions_run",
        scheduledDate: tomorrow.toISOString().split('T')[0],
        scheduledTime: "7:00 AM"
      });
      
      // Add exercises to HIIT workout
      await storage.createExercise({
        workoutId: hiitWorkout.id,
        name: "Jumping Jacks",
        sets: 4,
        reps: 30,
        icon: "directions_run"
      });
      
      await storage.createExercise({
        workoutId: hiitWorkout.id,
        name: "Burpees",
        sets: 4,
        reps: 15,
        icon: "directions_run"
      });
      
      // Create yoga workout for Wednesday
      const wednesday = new Date();
      wednesday.setDate(wednesday.getDate() + (3 + (7 - wednesday.getDay())) % 7);
      
      const yogaWorkout = await storage.createWorkout({
        userId: user.id,
        name: "Yoga & Stretching",
        description: "Gentle yoga and stretching for recovery and flexibility",
        duration: 45,
        icon: "self_improvement",
        scheduledDate: wednesday.toISOString().split('T')[0],
        scheduledTime: "6:30 PM"
      });
      
      // Add yoga poses as exercises
      await storage.createExercise({
        workoutId: yogaWorkout.id,
        name: "Sun Salutations",
        sets: 3,
        reps: 5,
        icon: "self_improvement"
      });
      
      await storage.createExercise({
        workoutId: yogaWorkout.id,
        name: "Warrior Poses",
        sets: 2,
        reps: 8,
        icon: "self_improvement"
      });
      
      // Create a weight loss goal
      await storage.createGoal({
        userId: user.id,
        name: "Lose Weight",
        targetValue: 65,
        currentValue: 68,
        startDate: new Date(),
        targetDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        completed: false
      });
      
      // Return the created user data
      res.status(201).json({
        user,
        message: "Demo account created successfully"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to set up demo account", error });
    }
  });

  // Mount all routes under /api prefix
  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate diet and workout recommendations based on health metrics
function generateRecommendations(healthMetric: any) {
  const { weight, height, bmi } = healthMetric;
  
  let dietRecommendation = {
    type: "maintenance",
    calories: 0,
    macros: { protein: 0, carbs: 0, fats: 0 },
    recommendations: []
  };
  
  let workoutRecommendation = {
    type: "balanced",
    frequency: "3-4 times per week",
    recommendations: []
  };
  
  // Calculate base metabolic rate (BMR) using Harris-Benedict Equation
  // This is simplified - would be more accurate with age and gender
  const bmr = 10 * weight + 6.25 * height - 5 * 30 + 5; // Assuming age 30 and male
  
  // Set calories based on BMI
  if (bmi < 18.5) {
    // Underweight
    dietRecommendation.type = "weight gain";
    dietRecommendation.calories = Math.round(bmr * 1.5);
    dietRecommendation.recommendations = [
      "Increase caloric intake with nutrient-dense foods",
      "Focus on protein-rich foods like lean meats, eggs, and legumes",
      "Include healthy fats from avocados, nuts, and olive oil",
      "Eat more frequently, 5-6 smaller meals throughout the day"
    ];
    
    workoutRecommendation.type = "strength focused";
    workoutRecommendation.recommendations = [
      "Focus on compound movements like squats, deadlifts, and bench press",
      "Limit cardio to 1-2 sessions per week of 20-30 minutes",
      "Prioritize resistance training with progressive overload",
      "Ensure adequate rest between workouts (48-72 hours per muscle group)"
    ];
  } else if (bmi >= 18.5 && bmi < 25) {
    // Normal weight
    dietRecommendation.type = "maintenance";
    dietRecommendation.calories = Math.round(bmr * 1.3);
    dietRecommendation.recommendations = [
      "Maintain a balanced diet with whole foods",
      "Include a variety of fruits and vegetables for micronutrients",
      "Stay hydrated with at least 8 glasses of water daily",
      "Balance macronutrients with each meal"
    ];
    
    workoutRecommendation.type = "balanced";
    workoutRecommendation.recommendations = [
      "Mix of cardio and strength training",
      "Include flexibility exercises 2-3 times per week",
      "Try interval training for efficiency",
      "Consider adding recreational activities like hiking or swimming"
    ];
  } else {
    // Overweight
    dietRecommendation.type = "weight loss";
    dietRecommendation.calories = Math.round(bmr * 1.1);
    dietRecommendation.recommendations = [
      "Create a moderate calorie deficit (300-500 calories below maintenance)",
      "Increase protein intake to preserve muscle mass",
      "Focus on fiber-rich foods for satiety",
      "Reduce refined carbohydrates and added sugars"
    ];
    
    workoutRecommendation.type = "fat loss focused";
    workoutRecommendation.recommendations = [
      "Include both cardio and strength training",
      "Try HIIT workouts for efficient calorie burning",
      "Aim for 150+ minutes of moderate activity per week",
      "Include active recovery days with walking or light activities"
    ];
  }
  
  // Calculate macros
  const proteinPerKg = dietRecommendation.type === "weight gain" ? 2.2 : 
                      dietRecommendation.type === "weight loss" ? 2.0 : 1.8;
  
  dietRecommendation.macros.protein = Math.round(weight * proteinPerKg);
  
  // Fats at 25-30% of calories
  dietRecommendation.macros.fats = Math.round((dietRecommendation.calories * 0.28) / 9);
  
  // Remaining calories from carbs
  const proteinCalories = dietRecommendation.macros.protein * 4;
  const fatCalories = dietRecommendation.macros.fats * 9;
  dietRecommendation.macros.carbs = Math.round((dietRecommendation.calories - proteinCalories - fatCalories) / 4);
  
  return {
    diet: dietRecommendation,
    workout: workoutRecommendation
  };
}
