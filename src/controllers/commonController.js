import User from "../models/user.js";


// CREATE
export const Create = async (req, res, entity) => {
    try {
        const data = await entity.create(req.body);
        return data
    } catch (err) {
        return err
    }
};

// GET ALL
export const GetAll = async (req, res, entity) => {
    try {
        const data = await entity.find();
        return data
    } catch (err) {
        return err
    }
};

// GET SINGLE
export const GetSingle = async (req, res, entity) => {
    try {
        const data = await entity.findById(req.params.id);
        return data
    } catch (err) {
        return err
    }

};

// UPDATE
export const Update = async (req, res, entity) => {
    try {
        const data = await entity.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!data) {
            return false
        }
        return data
    } catch (err) {
        return err
    }

};


// FILTER + SEARCH + PAGINATION
export const GetAllWithFilter = async (req, res, entity) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'createdAt',
            order = 'desc',
            ...filters
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Search across string fields dynamically
        const modelFields = Object.keys(entity.schema.paths);
        const stringFields = modelFields.filter(
            (field) => entity.schema.paths[field].instance === 'String'
        );

        const searchQuery = search
            ? { $or: stringFields.map((field) => ({ [field]: { $regex: search, $options: 'i' } })) }
            : {};

        // Extra filters from query params (e.g. ?role=Admin&isActive=true)
        const filterQuery = {};
        for (const key of Object.keys(filters)) {
            if (entity.schema.paths[key]) {
                filterQuery[key] = filters[key];
            }
        }

        const query = { ...searchQuery, ...filterQuery };

        const [data, total] = await Promise.all([
            entity.find(query)
                .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
                .skip(skip)
                .limit(limitNum),
            entity.countDocuments(query),
        ]);

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            data,
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};