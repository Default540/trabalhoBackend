import fs from 'fs';
import path from "path";

class DB {

    constructor() {
        const filePath = path.resolve("./src/database/database.json");
        const fileData = fs.readFileSync(filePath, "utf-8");
        this.db = JSON.parse(fileData);
    }

    select(search, filter) {
        
        let database = [...this.db[search]];
        if (!filter) return database;

        database = database.filter( (item) => {

            if (item.role === filter.role || filter.role === "ALL") {
                if (item.status === filter.status || filter.status === "ANY") {
                    
                    if (!filter.search || filter.search === ' '  || item.name.toLowerCase().includes(filter.search.toLowerCase()) || (filter.search.charAt(0) === "@" && item.username.toLowerCase().includes(filter.search)) ) {
                        return item;
                    }
                }
            }
        });

        database.sort((a, b) => {
            if (filter.sort === "NEW") {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }else if (filter.sort === "OLD") {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }else if (filter.sort === "A-Z") {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            }else if (filter.sort === "Z-A") {
                if (a.name > b.name) return -1;
                if (a.name < b.name) return 1;
                return 0;
            }

            return 1;
        });
        
        return database;
    }

    addUser(user){
        
        this.db.users.push(user);
        
        this.databaseSave();

    }
    editUser(newUser){
        

        const index = this.db.users.findIndex( user => user.id === newUser.id );

        console.log(index)
        if (index !== -1) {
            this.db.users[index] = newUser;
            this.databaseSave();
        }
        
    }

    removeUser(id){
        this.db.users = this.db.users.filter( user => user.id !== id );    
        this.databaseSave();

    }

    databaseSave(){
        fs.writeFileSync(
            "./src/database/database.json",
            JSON.stringify(this.db, null, 2),
            "utf-8"
        );
    }
}

export { DB };
