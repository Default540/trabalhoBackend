import { DB } from "../config/db.js";
import ExcelJS from "exceljs";

class UsersController {

    respostaPadrao(req, res) { 
        res.send("FUNCIONA") 
    };

    mostrarListaUsuarios(req, res) {
        
        const db = new DB();

        let {
            search = "",
            role = "ALL",
            status = "ANY",
            sort = "NEW",
            page = 1
        
        } = req.query;

        const filter = { search, role, status, sort};

        page = {
            current: parseInt(page),
        }

        const users = db.select("users", filter);

        page.total =  Math.ceil( users.length / 10);

        const dados = { 
            users: users.slice((page.current - 1) * 10, page.current * 10),
            filter: filter,
            page: page,
            totalUsers: users.length,
        };
        
        res.render('users-lista', { dados })
    }

    mostrarCriarUsuarios(req, res){
        const db = new DB();
        const dados = db.select("users");
        dados.errors = null;
        res.render('users-criar', { dados })
    }

    mostrarEditarUsuario(req, res){
        
        const { id } = req.params;
        const db = new DB();
        const user = db.select("users").find( user => user.id === parseInt(id) );
        
        if (!user) {
            return res.status(404).send("Usuário não encontrado");    
        }

        res.render('users-editar', { dados: { user } })
    }

    criarUsuario(req, res){
        
        
        const db = new DB();
        
        req.body.confirmPassword = req.body.confirmPassword || "";
        req = prepareUserData(req);


        const errors = checkUserIsValid(req.body);

        if (req.body.password !== req.body.confirmPassword) {
            errors.push("As senhas não conferem ou são inválidas");
        }

        if (errors.length > 0) {
            const dados = {
                errors: errors,
            };
            return res.status(400).render('users-criar', { dados });
        }else{
            const user = {
                id: req.body.id,
                name: req.body.name,
                username: req.body.username,
                role: req.body.role,
                status: req.body.status,
                email: req.body.email,
                password: req.body.password,
                createdAt: req.body.createdAt
            }
            
            db.addUser(user);

            return res.status(201).redirect("/users/lista");
        }
    }

    editarUsuario(req, res){
        
        
        const db = new DB();

        

        req = prepareUserData(req);
        const errors = checkUserIsValid(req.body);
        let user = db.select("users").find( user => user.id === parseInt(req.body.id) );
        
        let dados = {};

        if (!user) {

            errors.push("Usuário não encontrado");
            return res.status(404).json({ success: false, errors: errors });

        } 
        
        dados.user = user;

        if (user.password !== req.body.currentPassword) {
            
            errors.push("Senha atual incorreta");
            dados.errors = errors;

            return res.status(403).render('users-editar', { dados });

        }else if (req.body.password !== req.body.confirmPassword) {
            errors.push("As senhas não conferem ou são inválidas");
        }
        
        dados.errors = errors;

        
        if (errors.length > 0) {
            return res.status(400).render('users-editar', { dados });
        }else{
            const editedUser = {
                id: req.body.id,
                name: req.body.name,
                username: req.body.username,
                role: req.body.role,
                status: req.body.status,
                email: req.body.email,
                password: req.body.password,
                createdAt: req.body.createdAt
            }

            db.editUser(editedUser);
            return res.status(201).redirect("/users/lista");
        }
    }

    deletarUsuario(req, res){
        const { id } = req.body;
        const db = new DB();
        const user = db.select("users").find( user => user.id === parseInt(id) );
        
        if (!user) {
            return res.status(404).send("Usuário não encontrado");    
        }
        
        db.removeUser(user.id);
        return res.status(200).redirect("/users/lista");
    }

    async downloadUsers(req, res) {

        const db = new DB();
        let users = db.select("users");

        if (users.length === 0) {
           users = [
                {
                    id: null,
                    name: null,
                    username: null,
                    role: null,
                    status: null,
                    email: null,
                    createdAt: null,
                    password: null
                }
           ]
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Users");

        worksheet.columns = Object.keys(users[0]).map(key => ({
            header: key,
            key: key,
            width: 20
        }));

        users.forEach(user => {
            worksheet.addRow(user);
        });

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=users.xlsx"
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.send(buffer);
    }
}

function prepareUserData(req) {
    const db = new DB();

    req.body.id = parseInt(req.body.id) || db.select("users").findLast( item => item.id ).id + 1;
    req.body.name = req.body.name.trim() || "";
    req.body.username = req.body.username.trim() || "";
    
    if (!req.body.username.includes("@")) req.body.username = "@" + req.body.username;
    
    req.body.role = req.body.role.trim() || "";
    req.body.status = req.body.status.trim() || "";
    req.body.email = req.body.email.trim() || "";
    req.body.password = req.body.password || ""; 
    req.body.createdAt = new Date().toISOString().slice(0, 10);
    
    return req;
}

function checkUserIsValid(user) {

    const db = new DB();
    let errors = [];

 
    if (!user.id) {
        errors.push("ID invalido");
    }

    if (!user.name || user.name.split(" ").length <= 1){
        errors.push("O nome deve conter nome e sobrenome");
    } 
    
    if (user.username.includes(" ") || user.username.length <= 1 || db.select("users").find(item => (item.username == user.username && item.id != user.id ))) {
        errors.push("Username inválido");
    }

    if (!user.role || user.role !== "ADMIN" && user.role !== "MANAGER" && user.role !== "EDITOR" && user.role !== "VIEWER") errors.push("Role inválido");

    if (!user.status || user.status !== "ACTIVE" && user.status !== "INACTIVE" && user.status !== "SUSPENDED" && user.status !== "INVITED") errors.push("Status inválido");


    if (!user.email || !user.email.includes("@") || !user.email.includes(".") || user.email.includes(" ") || db.select("users").find(item => (item.email == user.email && item.id != user.id))) errors.push("Email inválido")
    

    if (!user.password || user.password.length < 8) errors.push("As senhas não conferem ou são inválidas");

    if (!user.createdAt) {
        errors.push("Data de criação inválida");
    }

    return errors;
}

export { UsersController }

