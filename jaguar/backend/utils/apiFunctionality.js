class APIFunctionality{
    constructor(query,queryStr){
        this.query=query,
        this.queryStr=queryStr
    }

    search(){
        const keyword=this.queryStr.keyword?{
            name:{
                $regex:this.queryStr.keyword,
                $options:"i"
            }
        }:{};
        this.query=this.query.find({...keyword});
        
        return this
    }

    filter(){
        const queryCopy={...this.queryStr};
        const removeFields=["keyword","page","limit","sort"];
        removeFields.forEach(key=>delete queryCopy[key]);
        this.query=this.query.find(queryCopy)
        return this
        
    }

    sort(){
        const sortOptions={
            price_asc:{price:1},
            price_desc:{price:-1},
            rating_desc:{ratings:-1},
            newest:{createdAt:-1}
        };
        const sortBy=sortOptions[this.queryStr.sort];
        if(sortBy){
            this.query=this.query.sort(sortBy);
        }
        return this
    }

    pagination(resultPerPage){
        const currentPage=Number(this.queryStr.page) ||1
        const skip=resultPerPage*(currentPage-1);
        this.query=this.query.limit(resultPerPage).skip(skip)
        return this
    }
}
export  default APIFunctionality;