import { Router } from "express"
import { UsersController } from "../controller/users-controller.js";

const usersRouter = Router();
const usersController = new UsersController();


usersRouter.get('/lista',  usersController.mostrarListaUsuarios);

usersRouter.get('/criar',  usersController.mostrarCriarUsuarios);
usersRouter.post('/criar', usersController.criarUsuario);


usersRouter.get('/edit/:id',   usersController.mostrarEditarUsuario);
usersRouter.post('/edit',  usersController.editarUsuario);

usersRouter.post('/delete', usersController.deletarUsuario);

usersRouter.get('/download', usersController.downloadUsers);

export  { usersRouter }