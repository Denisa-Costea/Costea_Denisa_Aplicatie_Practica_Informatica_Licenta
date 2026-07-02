'use client'; // Permite componentelor interactive să ruleze pe client (state-uri și pop-up dialogs)

import { useEffect, useState } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
    Button,
    Badge,
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
    Label,
    Input,
    Alert, AlertDescription
} from '@/components/ui';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { Ban, Trash2, CheckCircle, Edit, Users, UserCheck } from 'lucide-react';
import styles from './users.module.scss'; // Stilurile SCSS specifice tabelului de useri

interface UserData {
    id: number;
    email: string;
    is_active: boolean;
    is_superuser: boolean;
    created_at: string;
    license?: {
        plan_type: string;
    };
}

export default function UsersPage() {
    // 1. STATE-URILE COMPONENTEI PENTRU UTILIZATORI
    const [users, setUsers] = useState<UserData[]>([]); // Stochează lista completă de utilizatori
    const [loading, setLoading] = useState(true); // Indicator încărcare listă
    const [actionLoading, setActionLoading] = useState<number | null>(null); // Urmărește ID-ul userului pe care se rulează o acțiune (blocare/ștergere)
    const [error, setError] = useState<string | null>(null); // Mesaje de eroare globală

    // Stări locale pentru dialogul modal de Editare Date Utilizator
    const [editUser, setEditUser] = useState<UserData | null>(null); // Utilizatorul în curs de editare
    const [editEmail, setEditEmail] = useState(''); // Valoarea emailului din formular
    const [editPassword, setEditPassword] = useState(''); // Parola opțională din formular
    const [editOpen, setEditOpen] = useState(false); // Starea de vizibilitate a ferestrei modale

    // 2. EFECT PENTRU INCARCAREA UTILIZATORILOR LA PORNIRE
    useEffect(() => {
        fetchUsers();
    }, []);

    // Funcția care preia utilizatorii de la server
    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
            setError("Încărcarea utilizatorilor a eșuat");
        } finally {
            setLoading(false);
        }
    };

    // 3. ACTIVARE / BLOCARE UTILIZATOR (Apelează `/admin/users/{id}/status`)
    const handleToggleStatus = async (user: UserData) => {
        if (confirm(`Sigur doriți să ${user.is_active ? 'blocați' : 'activați'} acest utilizator?`)) {
            setActionLoading(user.id);
            try {
                // Trimitem starea opusă (is_active: !user.is_active)
                await api.put(`/admin/users/${user.id}/status`, null, {
                    params: { is_active: !user.is_active }
                });
                // Actualizăm starea locală a listei fără a reîncărca tot tabelul
                setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
            } catch (error) {
                console.error("Failed to update status", error);
                setError("Actualizarea statusului utilizatorului a eșuat");
            } finally {
                setActionLoading(null);
            }
        }
    };

    // 4. ȘTERGERE UTILIZATOR (Apelează `/admin/users/{id}`)
    const handleDelete = async (userId: number) => {
        if (confirm('Sigur doriți să ȘTERGEȚI acest utilizator? Această acțiune este ireversibilă.')) {
            setActionLoading(userId);
            try {
                await api.delete(`/admin/users/${userId}`);
                // Eliminăm utilizatorul din tabelul randat
                setUsers(users.filter(u => u.id !== userId));
            } catch (error) {
                console.error("Failed to delete user", error);
                setError("Ștergerea utilizatorului a eșuat");
            } finally {
                setActionLoading(null);
            }
        }
    };

    // Deschide dialogul de editare și încarcă datele utilizatorului selectat
    const openEditDialog = (user: UserData) => {
        setEditUser(user);
        setEditEmail(user.email);
        setEditPassword('');
        setEditOpen(true);
    };

    // 5. TRIMITERE MODIFICĂRI PROFIL DE CĂTRE ADMIN (Apelează `/admin/users/{id}`)
    const handleUpdateUser = async () => {
        if (!editUser) return;

        try {
            await api.put(`/admin/users/${editUser.id}`, {
                email: editEmail,
                password: editPassword || undefined, // Trimite parola doar dacă s-a introdus ceva nou
            });
            // Modifică datele în starea locală
            setUsers(users.map(u => u.id === editUser.id ? { ...u, email: editEmail } : u));
            setEditOpen(false);
            setEditUser(null);
        } catch (error: any) {
            console.error("Failed to update user", error);
            if (error.response?.data?.detail) {
                alert(`Eroare: ${error.response.data.detail}`);
            } else {
                alert("Actualizarea utilizatorului a eșuat");
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Se încarcă utilizatorii...</div>;

    const activeUsersCount = users.filter(u => u.is_active).length;

    return (
        <div className={styles.pageWrapper}>
            {/* Antetul paginii cu statistici rapide de utilizatori */}
            <div className={styles.pageHeader}>
                <div className={styles.headerText}>
                    <h2 className={styles.title}>Gestiune Utilizatori</h2>
                    <p className={styles.subtitle}>Administrează drepturile de acces, rolurile și statusul utilizatorilor.</p>
                </div>
                
                {/* Panel Statistici Rapide */}
                <div className={styles.headerStats}>
                    <div className={styles.statCard}>
                        <div className={styles.blueIconBox}>
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <div className={styles.statLabel}>Total Utilizatori</div>
                            <div className={styles.statValue}>{users.length}</div>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.greenIconBox}>
                            <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <div className={styles.statLabel}>Activi</div>
                            <div className={styles.statValue}>{activeUsersCount}</div>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Tabelul cu Utilizatori */}
            <div className={styles.card}>
                <div className="p-0">
                    <Table>
                        <TableHeader className={styles.tableHeaderRow}>
                            <TableRow className={styles.tableHeadRow}>
                                <TableHead className={styles.tableHeadText}>ID</TableHead>
                                <TableHead className={styles.tableHeadText}>Utilizator</TableHead>
                                <TableHead className={styles.tableHeadText}>Status</TableHead>
                                <TableHead className={styles.tableHeadText}>Rol</TableHead>
                                <TableHead className={styles.tableHeadText}>Plan</TableHead>
                                <TableHead className={styles.tableHeadText}>Data Înregistrării</TableHead>
                                <TableHead className="text-right text-slate-400 font-medium">Acțiuni</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} className={styles.tableRow}>
                                    <TableCell className={styles.idCell}>{user.id}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className={styles.userEmail}>{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {/* Status activ/blocat sub formă de badge */}
                                        {user.is_active ? (
                                            <Badge variant="secondary" className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20">
                                                Activ
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20">
                                                Blocat
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`border-0 ${user.is_superuser ? "bg-purple-500/20 text-purple-300" : "bg-slate-800 text-slate-400"}`}>
                                            {user.is_superuser ? 'Admin' : 'Utilizator'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-sm text-slate-300">
                                            {user.license?.plan_type || 'FREE'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {format(new Date(user.created_at), 'dd.MM.yyyy')}
                                    </TableCell>
                                    
                                    {/* Acțiunile posibile (disponibile doar pentru utilizatori obișnuiți, nu și pentru alți admini) */}
                                    <TableCell className={styles.actionsCell}>
                                        {!user.is_superuser && (
                                            <div className={styles.actionRow}>
                                                {/* Editare */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(user)}
                                                    title="Editează Utilizator"
                                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {/* Blocare / Deblocare status */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggleStatus(user)}
                                                    disabled={actionLoading === user.id}
                                                    title={user.is_active ? "Blochează Utilizator" : "Activează Utilizator"}
                                                    className={user.is_active ? "text-orange-400 hover:text-orange-300 hover:bg-orange-400/10" : "text-green-400 hover:text-green-300 hover:bg-green-400/10"}
                                                >
                                                    {user.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                </Button>
                                                {/* Ștergere definitivă */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    title="Șterge Utilizator"
                                                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* FEREASTRĂ MODALĂ DE EDITARE DETALII UTILIZATOR */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-100">
                    <DialogHeader>
                        <DialogTitle>Editează Utilizatorul</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Actualizați adresa de email sau parola pentru {editUser?.email}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Modificare Email */}
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="text-slate-300">
                                Adresă de Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-slate-100"
                            />
                        </div>
                        {/* Resetare Parolă */}
                        <div className="grid gap-2">
                            <Label htmlFor="password" className="text-slate-300">
                                Noua Parolă (Opțional)
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Lăsați gol pentru a păstra parola actuală"
                                value={editPassword}
                                onChange={(e) => setEditPassword(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-slate-100"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateUser} className="bg-blue-600 hover:bg-blue-700 text-white">Salvează Modificările</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
