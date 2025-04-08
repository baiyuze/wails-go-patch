export namespace dto {
	
	export class FileData {
	    filename: string;
	    data: string;
	    targetPath: string;
	
	    static createFrom(source: any = {}) {
	        return new FileData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.filename = source["filename"];
	        this.data = source["data"];
	        this.targetPath = source["targetPath"];
	    }
	}

}

