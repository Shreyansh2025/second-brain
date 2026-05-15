import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        type:{
            type: String,
            enum: ['link','video', 'note', 'other'],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        isFavorite: {
            type: Boolean,
            default: false, 
        },

        // link specific
        url: String,
        siteName: String,
        previewImage: String,

        //video specific
        platform: {
            type: String,
        },
        videoId: String,
        channel: String,
        duration: String,
        thumbnail: String,

        // image/reel specific
        imageUrl: String,
        extractedText: String,
        youtubeVideoId: String,
        youtubeTitle: String,

        //note specific
        body: String,

        //custom type
        customType: String,
    },
    { timestamps: true }
)

resourceSchema.index({ 
    title: 'text', 
    description: 'text', 
    tags: 'text' ,
    extractedText: 'text',
    body: 'text',
    url: 'text',
    youtubeTitle: 'text',
})

resourceSchema.index({ tags: 1 })

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
