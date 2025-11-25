import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { errorHandler, notFoundHandler } from './middleware';

// Import routes
import { authRoutes } from './modules/auth';
import { tenantsRoutes } from './modules/tenants';
import { lojasRoutes } from './modules/lojas';
import { usuariosRoutes } from './modules/usuarios';
import { fornecedoresRoutes } from './modules/fornecedores';
import { categoriasRoutes } from './modules/categorias';
import { produtosRoutes } from './modules/produtos';
import { embalagensRoutes } from './modules/embalagens';
import { listasComprasRoutes } from './modules/listas-compras';
import { comprasRoutes } from './modules/compras';
import { romaneiosRoutes } from './modules/romaneios';
import { financeiroRoutes } from './modules/financeiro';
import { embalagensRetornaveisRoutes } from './modules/embalagens-retornaveis';
import { devolucoesRoutes } from './modules/devolucoes';
import { relatoriosRoutes } from './modules/relatorios';
import { logsRoutes } from './modules/logs';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/tenants', tenantsRoutes);
apiRouter.use('/lojas', lojasRoutes);
apiRouter.use('/usuarios', usuariosRoutes);
apiRouter.use('/fornecedores', fornecedoresRoutes);
apiRouter.use('/categorias', categoriasRoutes);
apiRouter.use('/produtos', produtosRoutes);
apiRouter.use('/embalagens', embalagensRoutes);
apiRouter.use('/listas-compras', listasComprasRoutes);
apiRouter.use('/compras', comprasRoutes);
apiRouter.use('/romaneios', romaneiosRoutes);
apiRouter.use('/financeiro', financeiroRoutes);
// Embalagens retornáveis uses same base path as embalagens for saldos/movimentos
apiRouter.use('/embalagens', embalagensRetornaveisRoutes);
apiRouter.use('/devolucoes', devolucoesRoutes);
apiRouter.use('/relatorios', relatoriosRoutes);
apiRouter.use('/logs', logsRoutes);

app.use('/api/v1', apiRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
