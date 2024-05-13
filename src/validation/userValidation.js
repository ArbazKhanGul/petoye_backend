const {z}=require("zod")

const signupSchema=z.object({
    username: z.string({required_error:"Name is required"}).trim().min(3,{message:"Name must be at least 3 character"}).max(255,{message:"Name cannot be more than 255 character"}),
    email:z.string({required_error:"Email is required"}).trim().email()
})

module.exports=signupSchema;